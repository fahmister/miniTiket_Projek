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
exports.devPaymentSimulator = exports.dokuWebhook = exports.createTransaction = void 0;
// src/controllers/transaction.controller.ts
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
const createTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { event_id, user_id, quantity } = req.body;
    try {
        // 1. Validasi event dan kursi
        const event = yield prisma.event.findUnique({ where: { id: event_id } });
        if (!event || event.seats < quantity) {
            return res.status(400).json({ error: "Kuota event tidak cukup" });
        }
        // 2. Hitung total harga
        const total = event.price * quantity;
        const order_id = `DEV-TRX-${Date.now()}`;
        // 3. Kurangi kursi event
        yield prisma.event.update({
            where: { id: event_id },
            data: { seats: { decrement: quantity } }
        });
        // 4. Generate payment URL yang benar
        const paymentUrl = `http://localhost:8000/api/transactions/dev-payment/${order_id}`;
        // 5. Simpan transaksi ke database
        const transaction = yield prisma.transaction.create({
            data: {
                user_id: parseInt(user_id),
                event_id,
                total_amount: total,
                payment_method: 'doku',
                status: 'waiting_for_payment',
                doku_payment_id: `dev-${crypto_1.default.randomUUID()}`,
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
    }
    catch (error) {
        // Rollback kursi jika error
        yield prisma.event.update({
            where: { id: event_id },
            data: { seats: { increment: quantity } }
        });
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
});
exports.createTransaction = createTransaction;
const dokuWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { invoice_number, status } = req.body;
        if (!invoice_number || !status) {
            return res.status(400).json({ error: "Data tidak lengkap" });
        }
        // Gunakan findFirst jika doku_invoice belum @unique
        const transaction = yield prisma.transaction.findFirst({
            where: { doku_invoice: invoice_number }
        });
        if (!transaction) {
            return res.status(404).json({ error: "Transaksi tidak ditemukan" });
        }
        let newStatus;
        switch (status) {
            case 'SUCCESS':
                newStatus = 'done';
                break;
            case 'FAILED':
            case 'EXPIRED':
                newStatus = 'expired';
                yield prisma.event.update({
                    where: { id: transaction.event_id },
                    data: { seats: { increment: transaction.quantity } }
                });
                break;
            default:
                newStatus = 'waiting_for_admin';
        }
        yield prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: newStatus }
        });
        res.status(200).json({
            message: "Webhook processed",
            transaction_id: transaction.id,
            new_status: newStatus
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});
exports.dokuWebhook = dokuWebhook;
const devPaymentSimulator = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.devPaymentSimulator = devPaymentSimulator;
// Helper functions
const mapDokuStatus = (dokuStatus) => {
    switch (dokuStatus) {
        case 'SUCCESS': return 'done';
        case 'FAILED': return 'rejected';
        case 'EXPIRED': return 'expired';
        default: return 'waiting_for_admin';
    }
};
