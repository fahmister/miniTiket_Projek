import prisma from "../lib/prisma";

export async function createTransaction(
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
        seats: true, 
        price: true,
        user_id: true
      }
    });
    
    if (!event) {
      throw new Error("Event tidak ditemukan");
    }

    if (event.seats < quantity) {
      throw new Error("Kuota event tidak mencukupi");
    }

    // 2. Dapatkan data user dan points
    const user = await tx.users.findUnique({
      where: { id: userId },
      select: { 
        user_points: true,
        id: true
      }
    });

    if (!user) {
      throw new Error("User tidak ditemukan");
    }

    // 3. Hitung Total
    let total = event.price * quantity;
    let pointsUsed = 0;

    // 4. Apply Voucher (jika ada)
    if (options?.voucherCode) {
      const voucher = await tx.voucher.findUnique({
        where: { 
          code: options.voucherCode,
          event_id: eventId
        }
      });

      if (!voucher) {
        throw new Error("Voucher tidak ditemukan");
      }

      if (voucher.current_usage >= voucher.max_usage) {
        throw new Error("Voucher sudah mencapai batas penggunaan");
      }

      total -= voucher.discount;

      // Update penggunaan voucher
      await tx.voucher.update({
        where: { id: voucher.id },
        data: { current_usage: { increment: 1 } }
      });
    }

    // 5. Apply Coupon (jika ada)
    if (options?.couponCode) {
      const coupon = await tx.coupon.findUnique({
        where: { code: options.couponCode }
      });

      if (!coupon) {
        throw new Error("Coupon tidak ditemukan");
      }

      if (coupon.current_usage >= coupon.max_usage) {
        throw new Error("Coupon sudah mencapai batas penggunaan");
      }

      total -= coupon.discount_percentage / 100 * total;
      total = Math.max(total, 0); // Pastikan total tidak negatif

      // Update penggunaan coupon
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { current_usage: { increment: 1 } }
      });
    }

    // 6. Apply Points (jika dipilih)
    if (options?.usePoints) {
      if (user.user_points <= 0) {
        throw new Error("Point user tidak mencukupi");
      }

      pointsUsed = Math.min(user.user_points, total);
      total -= pointsUsed;

      // Update point user
      await tx.users.update({
        where: { id: user.id },
        data: { user_points: { decrement: pointsUsed } }
      });
    }

    // 7. Buat Transaksi
    const transaction = await tx.transaction.create({
      data: {
        status: "waiting_for_payment",
        payment_date: new Date(),
        total_amount: total,
        payment_method: "transfer",
        user_id: user.id
      }
    });

    // 8. Kurangi Stok Event
    await tx.event.update({
      where: { id: eventId },
      data: { seats: { decrement: quantity } }
    });

    return {
      transaction,
      pointsUsed,
      finalAmount: total
    };
  });
}