import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function createDokuTransaction(
  userId: number,
  eventId: string,
  quantity: number,
  options?: {
    voucherCode?: string;
    couponCode?: string;
    usePoints?: boolean;
  }
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Validasi Event
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: { 
        name: true,
        seats: true, 
        price: true,
        user_id: true 
      }
    });
    
    if (!event) throw new Error("Event tidak ditemukan");
    if (event.seats < quantity) throw new Error("Kuota event tidak mencukupi");

    // 2. Hitung Total
    let total = event.price * quantity;
    let pointsUsed = 0;

    // 3. Validasi Voucher
    if (options?.voucherCode) {
      const voucher = await tx.voucher.findUnique({
        where: { 
          code: options.voucherCode,
          event_id: eventId
        }
      });

      if (!voucher) throw new Error("Voucher tidak ditemukan");
      if (voucher.current_usage >= voucher.max_usage) throw new Error("Voucher sudah habis");

      total -= voucher.discount;
      await tx.voucher.update({
        where: { id: voucher.id },
        data: { current_usage: { increment: 1 } }
      });
    }

    // 4. Validasi Coupon
    if (options?.couponCode) {
      const coupon = await tx.coupon.findUnique({
        where: { code: options.couponCode }
      });

      if (!coupon) throw new Error("Coupon tidak ditemukan");
      if (coupon.current_usage >= coupon.max_usage) throw new Error("Coupon sudah habis");

      total -= coupon.discount_percentage / 100 * total;
      total = Math.max(total, 0);

      await tx.coupon.update({
        where: { id: coupon.id },
        data: { current_usage: { increment: 1 } }
      });
    }

    // 5. Validasi Points
    if (options?.usePoints) {
      const user = await tx.users.findUnique({
        where: { id: userId },
        select: { user_points: true }
      });

      if (!user || user.user_points <= 0) throw new Error("Poin tidak mencukupi");
      
      pointsUsed = Math.min(user.user_points, total);
      total -= pointsUsed;

      await tx.users.update({
        where: { id: userId },
        data: { user_points: { decrement: pointsUsed } }
      });
    }

    // 6. Generate DOKU Payment
    const clientId = process.env.DOKU_CLIENT_ID!;
    const secretKey = process.env.DOKU_SECRET_KEY!;
    const requestId = crypto.randomUUID();
    const requestTimestamp = new Date().toISOString();
    const path = '/checkout/v1/payment';
    const order_id = `TRX-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const body = {
      order: {
        amount: total,
        invoice_number: order_id,
        items: [{
          name: event.name,
          price: event.price,
          quantity: quantity
        }]
      },
      payment: {
        payment_due_date: 60
      },
      customer: {
        id: userId.toString()
      }
    };

    const signatureComponent = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${path}\n${JSON.stringify(body)}`;
    const signature = crypto.createHmac('sha256', secretKey)
      .update(signatureComponent)
      .digest('base64');

    const dokuUrl = process.env.DOKU_IS_PRODUCTION === 'true'
      ? 'https://api.doku.com/checkout/v1/payment'
      : 'https://api-sandbox.doku.com/checkout/v1/payment';

    const response = await axios.post(dokuUrl, body, {
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': clientId,
        'Request-Id': requestId,
        'Request-Timestamp': requestTimestamp,
        'Signature': `HMACSHA256=${signature}`
      }
    });

    // 7. Simpan Transaksi
    const transaction = await tx.transaction.create({
      data: {
        user_id: userId,
        event_id: eventId,
        total_amount: total,
        payment_method: 'doku',
        status: 'waiting_for_payment',
        doku_payment_id: response.data.payment.id,
        doku_invoice: order_id,
        doku_payment_url: response.data.payment.url,
        quantity,
        expired_at: new Date(Date.now() + 2 * 60 * 60 * 1000)
      }
    });

    // 8. Kurangi Kursi Event
    await tx.event.update({
      where: { id: eventId },
      data: { seats: { decrement: quantity } }
    });

    return {
      transaction,
      payment_url: response.data.payment.url,
      points_used: pointsUsed
    };
  });
}
