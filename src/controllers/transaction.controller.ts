// src/controllers/transaction.controller.ts
import { PrismaClient, TransactionStatus } from '@prisma/client';
import crypto from 'crypto';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const createTransaction = async (req: Request, res: Response) => {
  const { event_id, user_id, quantity } = req.body;

  try {
    // 1. Validasi event dan kursi
    const event = await prisma.event.findUnique({ where: { id: event_id } });
    if (!event || event.seats < quantity) {
      return res.status(400).json({ error: "Kuota event tidak cukup" });
    }

    // 2. Hitung total harga
    const total = event.price * quantity;
    const order_id = `DEV-TRX-${Date.now()}`;

    // 3. Kurangi kursi event
    await prisma.event.update({
      where: { id: event_id },
      data: { seats: { decrement: quantity } }
    });

    // 4. Generate payment URL yang benar
    const paymentUrl = `http://localhost:8000/api/transactions/dev-payment/${order_id}`;

    // 5. Simpan transaksi ke database
    const transaction = await prisma.transaction.create({
      data: {
        user_id: parseInt(user_id),
        event_id,
        total_amount: total,
        payment_method: 'doku',
        status: 'waiting_for_payment',
        doku_payment_id: `dev-${crypto.randomUUID()}`,
        doku_invoice: order_id,
        doku_payment_url: paymentUrl,
        quantity,
        expired_at: new Date(Date.now() + 2 * 60 * 60 * 1000)
      }
    });

    res.status(201).json({
      payment_url: paymentUrl,
      transaction,
      message: "DEV MODE: Silakan akses payment_url untuk simulasi pembayaran"
    });

  } catch (error) {
    // Rollback kursi jika error
    await prisma.event.update({
      where: { id: event_id },
      data: { seats: { increment: quantity } }
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
};
export const dokuWebhook = async (req: Request, res: Response) => {
    try {
      const { invoice_number, status } = req.body;
  
      if (!invoice_number || !status) {
        return res.status(400).json({ error: "Data tidak lengkap" });
      }
  
      // Gunakan findFirst jika doku_invoice belum @unique
      const transaction = await prisma.transaction.findFirst({
        where: { doku_invoice: invoice_number }
      });
  
      if (!transaction) {
        return res.status(404).json({ error: "Transaksi tidak ditemukan" });
      }
  
      let newStatus: TransactionStatus;
      switch (status) {
        case 'SUCCESS':
          newStatus = 'done';
          break;
        case 'FAILED':
        case 'EXPIRED':
          newStatus = 'expired';
          await prisma.event.update({
            where: { id: transaction.event_id },
            data: { seats: { increment: transaction.quantity } }
          });
          break;
        default:
          newStatus = 'waiting_for_admin';
      }
  
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: newStatus }
      });
  
      res.status(200).json({
        message: "Webhook processed",
        transaction_id: transaction.id,
        new_status: newStatus
      });
  
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: errorMessage });
    }
  };
  

export const devPaymentSimulator = async (req: Request, res: Response) => {
    const { trx_id } = req.params;
    res.send(`
      <h1>Simulator Pembayaran Development</h1>
      <p>Invoice: ${trx_id}</p>
      <button onclick="pay('SUCCESS')">Bayar (Success)</button>
      <button onclick="pay('FAILED')">Gagal</button>
      <script>
        function pay(status) {
          fetch('/api/transactions/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoice_number: '${trx_id}',
              status: status
            })
          })
          .then(res => res.json())
          .then(data => alert('Status: ' + status + '\\n' + JSON.stringify(data)))
          .catch(err => alert('Error: ' + err));
        }
      </script>
    `);
  };
  

// Helper functions
const mapDokuStatus = (dokuStatus: string): TransactionStatus => {
  switch(dokuStatus) {
    case 'SUCCESS': return 'done';
    case 'FAILED': return 'rejected';
    case 'EXPIRED': return 'expired';
    default: return 'waiting_for_admin';
  }
};
