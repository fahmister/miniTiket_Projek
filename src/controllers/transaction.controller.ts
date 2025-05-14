// src/controllers/transaction.controller.ts
import { PrismaClient, TransactionStatus } from '@prisma/client';
import crypto from 'crypto';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
export const createManualTransaction = async (req: Request, res: Response) => {
  const { event_id, user_id, quantity, voucherCode, couponCode, usePoints } = req.body;

  try {
    // 1. Validasi event
    const event = await prisma.event.findUnique({ where: { id: event_id } });
    if (!event || event.seats < quantity) {
      return res.status(400).json({ error: "Kuota tidak tersedia" });
    }

    // 2. Hitung total dengan voucher/kupon/poin
    let total = event.price * quantity;
    
    // [Tambahkan logika voucher, kupon, dan poin di sini]

    // 3. Buat transaksi
    const transaction = await prisma.transaction.create({
      data: {
        user_id: parseInt(user_id),
        event_id,
        total_amount: total,
        status: 'waiting_for_payment',
        quantity,
        expired_at: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 jam
      }
    });

    // 4. Kurangi kursi
    await prisma.event.update({
      where: { id: event_id },
      data: { seats: { decrement: quantity } }
    });

    res.status(201).json({
      transaction,
      payment_proof_upload_url: `/api/transactions/${transaction.id}/upload-proof`
    });

  } catch (error) {
    // Rollback kursi jika error
    await prisma.event.update({
      where: { id: event_id },
      data: { seats: { increment: quantity } }
    });
    
    res.status(500).json({ error: error.message });
  }
};

export const uploadPaymentProof = async (req: Request, res: Response) => {
  const { transactionId } = req.params;
  const { paymentProof } = req.body; // Asumsi sudah diupload ke storage

  try {
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        payment_proof: paymentProof,
        status: 'waiting_for_admin',
        payment_date: new Date(),
        expired_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 hari
      }
    });

    // Kirim notifikasi ke admin
    sendNotificationToOrganizer(transaction.event_id);

    res.json({ transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};