import cron from 'node-cron';
import prisma from '../lib/prisma';

cron.schedule('0 0 * * *', async () => { // Daily at midnight
  const now = new Date();
  
  const expiringTransactions = await prisma.pointTransactions.findMany({
    where: {
      expiry_date: { lte: now },
      is_expired: false
    }
  });

  for (const transaction of expiringTransactions) {
    await prisma.$transaction([
      prisma.users.update({
        where: { id: transaction.userId },
        data: { user_points: { decrement: transaction.amount } }
      }),
      prisma.pointTransactions.update({
        where: { id: transaction.id },
        data: { is_expired: true }
      })
    ]);
  }
});