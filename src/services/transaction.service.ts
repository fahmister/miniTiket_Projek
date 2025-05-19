import prisma from '../lib/prisma';
import axios from 'axios';
import crypto from 'crypto';
import { sendTransactionStatusEmail } from './transaction.email.service';


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
  try {
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
    const clientId = process.env.DOKU_CLIENT_ID;
    const secretKey = process.env.DOKU_SECRET_KEY!;
    const requestId = crypto.randomUUID();
    const requestTimestamp = new Date().toISOString();
    const path = '/checkout/v1/payment';
    const order_id = `TRX-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    if (!clientId || !secretKey) {
      throw new Error("DOKU credentials not configured");
    }

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

    const digest = crypto.createHash('sha256').update(JSON.stringify(body)).digest('base64');
    
    const signatureComponent = [
      `Client-Id:${clientId}`,
      `Request-Id:${requestId}`,
      `Request-Timestamp:${requestTimestamp}`,
      `Request-Target:${path}`,
      `Digest:${digest}`
    ].join('\n');
    
    const signature = crypto.createHmac('sha256', secretKey)
      .update(signatureComponent)
      .digest('base64');

    const dokuUrl = process.env.DOKU_IS_PRODUCTION === 'true'
      ? 'https://api.doku.com/checkout/v1/payment'
      : 'https://api-sandbox.doku.com/checkout/v1/payment';

    let response;
    try {
      response = await axios.post(dokuUrl, body, {
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': clientId,
        'Request-Id': requestId,
        'Request-Timestamp': requestTimestamp,
        'Signature': `HMACSHA256=${signature}`,
        timeout: 8000 // 8 seconds (leave 2s buffer for Vercel)
      }
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'response' in error) {
    // @ts-ignore
    console.error("DOKU API Error:", (error as any).response.data);
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
    // @ts-ignore
    console.error("Network Error:", (error as any).message);
    } else {
    console.error("Unknown error occurred");
    }
    throw new Error("Payment gateway unavailable");
  }

    // 7. Simpan Transaksi
    const transaction = await tx.transaction.create({
      data: {
        user_id: userId,
        event_id: eventId,
        total_amount: total,
        payment_method: 'manual',
        status: 'waiting_for_payment',
        id: response.data.payment.id,
        payment_proof: "",
        expired_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
        quantity: quantity
      }
    });

    // 8. Kurangi Kursi Event
    const updatedEvent = await tx.event.update({
      where: { 
        id: eventId,
        seats: { gte: quantity } // Prevent overbooking
      },
      data: { seats: { decrement: quantity } }
    });

    if (!updatedEvent) throw new Error("Seats no longer available");

    return {
      transaction: { id: transaction.id, status: transaction.status }, // Minimal data
      payment_url: response.data.payment.url,
      points_used: pointsUsed
    };
  });
  } catch (error) {
    console.error("Transaction failed:", error);
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(`Payment processing error: ${errorMessage}`);
  }
} 

// Line Victor Adi Winata
// This function is used on the EO daashboard to view, accept, and reject transactions
export async function getOrganizerTransactions(userId: number) {
  return prisma.transaction.findMany({
    where: {
      event: {
        user_id: userId
      }
    },
    include: {
      event: {
        select: { name: true }
      },
      user: {
        select: { first_name: true, last_name: true, email: true }
      }
    }
  });
}

export async function updateTransactionStatus(
  transactionId: string,
  userId: number,
  newStatus: 'done' | 'rejected',
  reason?: string
) {
  return prisma.$transaction(async (tx) => {
    // Verify transaction ownership
    const transaction = await tx.transaction.findFirst({
      where: {
        id: transactionId,
        event: { user_id: userId }
      },
      include: { event: true, user: true }
    });

    if (!transaction) throw new Error("Transaction not found");
    if (transaction.status === 'done') throw new Error("Transaction already completed");

    // Restore resources if rejecting
    if (newStatus === 'rejected') {
      // Restore seats
      await tx.event.update({
        where: { id: transaction.event_id },
        data: { seats: { increment: transaction.quantity } }
      });

      // Restore points
      if (transaction.point_used && transaction.point_used > 0) {
        await tx.users.update({
          where: { id: transaction.user_id },
          data: { user_points: { increment: transaction.point_used } }
        });
      }

      // Restore coupon
      if (transaction.coupon_code) {
        await tx.coupon.updateMany({
          where: { code: transaction.coupon_code },
          data: { current_usage: { decrement: 1 } }
        });
      }

      // Restore voucher
      if (transaction.voucher_code) {
        await tx.voucher.updateMany({
          where: { code: transaction.voucher_code },
          data: { current_usage: { decrement: 1 } }
        });
      }
    }

    // Update transaction status
    const updatedTransaction = await tx.transaction.update({
      where: { id: transactionId },
      data: { status: newStatus }
    });

 // Send email after transaction commits
    await sendTransactionStatusEmail(
      { ...transaction, ...updatedTransaction },
      newStatus === 'done' ? 'approved' : 'rejected',
      reason
    );

    return updatedTransaction;
  });
}