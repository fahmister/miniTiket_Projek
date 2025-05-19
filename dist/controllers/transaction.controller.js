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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransaction = void 0;
exports.getTransactionsController = getTransactionsController;
exports.updateTransactionStatusController = updateTransactionStatusController;
const client_1 = require("@prisma/client");
const cloudinary_1 = require("../utils/cloudinary"); // Asumsi sudah ada utility upload
const transaction_service_1 = require("../services/transaction.service");
const prisma = new client_1.PrismaClient();
const createTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const { quantity, usePoints, voucherCode, couponCode } = req.body;
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Unauthorized: user not found' });
        }
        const userId = req.user.id; // Asumsi menggunakan auth middleware
        // 1. Validasi event dan stok
        const event = yield prisma.event.findUnique({ where: { id: eventId } });
        if (!event || event.seats < quantity) {
            return res.status(400).json({ error: 'Not enough seats' });
        }
        // 2. Hitung total harga
        let total = event.price * quantity;
        // 3. Apply points
        if (usePoints) {
            const user = yield prisma.users.findUnique({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            total = Math.max(total - user.user_points, 0);
        }
        // 4. Handle payment proof upload
        const paymentProof = req.file; // Asumsi menggunakan multer middleware
        if (!paymentProof) {
            return res.status(400).json({ error: 'Payment proof required' });
        }
        const uploadResult = yield (0, cloudinary_1.cloudinaryUpload)(paymentProof);
        // 5. Create transaction
        const transaction = yield prisma.transaction.create({
            data: {
                total_amount: total,
                user_id: userId,
                event_id: eventId,
                quantity,
                expired_at: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 jam
                payment_proof: uploadResult.secure_url,
                status: 'waiting_for_admin'
            }
        });
        // 6. Kurangi kursi yang tersedia
        yield prisma.event.update({
            where: { id: eventId },
            data: { seats: event.seats - quantity }
        });
        res.status(201).json(transaction);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createTransaction = createTransaction;
// Line Victor Adi Winata
// This controller is created for EO to view, accept, and reject transactions at the EO dashboard
function getTransactionsController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = req.user;
            const transactions = yield (0, transaction_service_1.getOrganizerTransactions)(user.id);
            res.status(200).json(transactions);
        }
        catch (err) {
            next(err);
        }
    });
}
function updateTransactionStatusController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = req.user;
            const { status } = req.body;
            const transaction = yield (0, transaction_service_1.updateTransactionStatus)(req.params.id, user.id, status);
            res.status(200).json({
                message: "Transaction updated successfully",
                data: transaction
            });
        }
        catch (err) {
            next(err);
        }
    });
}
