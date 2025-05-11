import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

cron.schedule('* * * * *', async () => {
  await prisma.transaction.updateMany({
    where: { 
      status: 'waiting_for_payment',
      expired_at: { lt: new Date() }
    },
    data: { status: 'expired' }
  });

  // Rollback kursi untuk transaksi expired
  const transactions = await prisma.transaction.findMany({
    where: { status: 'expired' }
  });

  for (const trx of transactions) {
    await prisma.event.update({
      where: { id: trx.event_id },
      data: { seats: { increment: trx.quantity } }
    });
  }
});
