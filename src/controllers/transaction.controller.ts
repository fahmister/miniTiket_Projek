// transaction.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { cloudinaryUpload } from '../utils/cloudinary'; // Asumsi sudah ada utility upload
import { getOrganizerTransactions, 
        updateTransactionStatus
      } from '../services/transaction.service';
import { IUserReqParam } from '../custom';

const prisma = new PrismaClient();

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { quantity, usePoints, voucherCode, couponCode } = req.body;
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: user not found' });
    }
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
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      total = Math.max(total - user.user_points, 0);
    }

    // 4. Handle payment proof upload
    const paymentProof = req.file; // Asumsi menggunakan multer middleware
    if (!paymentProof) {
      return res.status(400).json({ error: 'Payment proof required' });
    }
    
    const uploadResult = await cloudinaryUpload(paymentProof);

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


// Line Victor Adi Winata
// This controller is created for EO to view, accept, and reject transactions at the EO dashboard
export async function getTransactionsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as IUserReqParam;
    const transactions = await getOrganizerTransactions(user.id);
    res.status(200).json(transactions);
  } catch (err) {
    next(err);
  }
}

export async function updateTransactionStatusController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as IUserReqParam;
    const { status } = req.body;
    
    const transaction = await updateTransactionStatus(
      req.params.id,
      user.id,
      status
    );
    
    res.status(200).json({
      message: "Transaction updated successfully",
      data: transaction
    });
  } catch (err) {
    next(err);
  }
}
