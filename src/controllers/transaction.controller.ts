// transaction.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TransactionStatus } from '../prisma';
import { uploadToCloudinary } from '../utils/cloudinary'; // Asumsi sudah ada utility upload

const prisma = new PrismaClient();

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { quantity, usePoints, voucherCode, couponCode } = req.body;
    const userId = req.user.id; // Asumsi menggunakan auth middleware
    
    // 1. Validasi event dan stok
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.seats < quantity) {
      return res.status(400).json({ error: 'Not enough seats' });
    }

    // 2. Hitung total harga
    let total = event.price * quantity;
    
    // 3. Apply points
    if (usePoints) {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      total = Math.max(total - user.user_points, 0);
    }

    // 4. Handle payment proof upload
    const paymentProof = req.file; // Asumsi menggunakan multer middleware
    if (!paymentProof) {
      return res.status(400).json({ error: 'Payment proof required' });
    }
    
    const uploadResult = await uploadToCloudinary(paymentProof.path);

    // 5. Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        total_amount: total,
        user_id: userId,
        event_id: eventId,
        quantity,
        expired_at: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 jam
        payment_proof: uploadResult.secure_url,
        status: 'waiting_for_admin'
      }
    });

    // 6. Kurangi kursi yang tersedia
    await prisma.event.update({
      where: { id: eventId },
      data: { seats: event.seats - quantity }
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Tambahkan fungsi lainnya...