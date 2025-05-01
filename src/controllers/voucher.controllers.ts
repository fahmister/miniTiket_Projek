import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

export async function createVoucher(req: Request, res: Response, next: NextFunction) {
  try {
    const { eventId } = req.params;
    const { code, discount, max_usage, expiry_date, name } = req.body;

    // Validasi input
    if (!code || !discount || !max_usage || !expiry_date) {
      throw new Error("Missing required fields");
    }

    // Cek event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error("Event not found");
    }

    const voucher = await prisma.voucher.create({
      data: {
        event_id: eventId,
        code,
        name: name || `Discount ${discount}%`, // Default name jika tidak diisi
        discount: Number(discount),
        max_usage: Number(max_usage),
        expiry_date: new Date(expiry_date),
        current_usage: 0
      }
    });

    res.status(201).json({
      message: "Voucher created successfully",
      voucher
    });
    
  } catch (err) {
    next(err);
  }
}