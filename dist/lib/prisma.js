"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Connect to the database using Prisma Client
const prisma = new client_1.PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    transactionOptions: {
        maxWait: 30000, // 30 seconds
        timeout: 25000, // 25 seconds
        isolationLevel: 'ReadCommitted' // Proper isolation level
    }
});
exports.default = prisma;
