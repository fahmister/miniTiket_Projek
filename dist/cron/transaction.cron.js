"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// transaction.cron.ts
const client_1 = require("@prisma/client");
const node_cron_1 = __importDefault(require("node-cron"));
const prisma = new client_1.PrismaClient();
// Jalankan setiap menit
node_cron_1.default.schedule('* * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    // Update expired transactions
    yield prisma.transaction.updateMany({
        where: {
            status: 'waiting_for_payment',
            expired_at: { lte: new Date() }
        },
        data: { status: 'expired' }
    });
    // Kembalikan kursi dan points untuk transaksi expired
    const expiredTransactions = yield prisma.transaction.findMany({
        where: { status: 'expired' },
        include: { event: true }
    });
    for (const tx of expiredTransactions) {
        // Rollback seats
        yield prisma.event.update({
            where: { id: tx.event_id },
            data: { seats: tx.event.seats + tx.quantity }
        });
        // Rollback points jika ada
        // ... tambahkan logika rollback points
    }
}));
