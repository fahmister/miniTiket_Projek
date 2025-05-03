import { PrismaClient } from "@prisma/client";
// Connect to the database using Prisma Client

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  transactionOptions: {
    maxWait: 30000, // 30 seconds
    timeout: 25000, // 25 seconds
    isolationLevel: 'ReadCommitted' // Proper isolation level
  }
});

export default prisma;