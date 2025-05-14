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
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
node_cron_1.default.schedule('* * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.transaction.updateMany({
        where: {
            status: 'waiting_for_payment',
            expired_at: { lt: new Date() }
        },
        data: { status: 'expired' }
    });
    // Rollback kursi untuk transaksi expired
    const transactions = yield prisma.transaction.findMany({
        where: { status: 'expired' }
    });
    for (const trx of transactions) {
        yield prisma.event.update({
            where: { id: trx.event_id },
            data: { seats: { increment: trx.quantity } }
        });
    }
}));
