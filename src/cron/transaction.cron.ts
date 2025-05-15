// transaction.cron.ts
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

const prisma = new PrismaClient();

// Jalankan setiap menit
cron.schedule('* * * * *', async () => {
  // Update expired transactions
  await prisma.transaction.updateMany({
    where: {
      status: 'waiting_for_payment',
      expired_at: { lte: new Date() }
    },
    data: { status: 'expired' }
  });

  // Kembalikan kursi dan points untuk transaksi expired
  const expiredTransactions = await prisma.transaction.findMany({
    where: { status: 'expired' },
    include: { event: true }
  });

  for (const tx of expiredTransactions) {
    // Rollback seats
    await prisma.event.update({
      where: { id: tx.event_id },
      data: { seats: tx.event.seats + tx.quantity }
    });

    // Rollback points jika ada
    // ... tambahkan logika rollback points
  }
});