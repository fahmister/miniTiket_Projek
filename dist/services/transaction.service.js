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
exports.createDokuTransaction = createDokuTransaction;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
function createDokuTransaction(userId, eventId, quantity, options) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
            // 1. Validasi Event
            const event = yield tx.event.findUnique({
                where: { id: eventId },
                select: {
                    name: true,
                    seats: true,
                    price: true,
                    user_id: true
                }
            });
            if (!event)
                throw new Error("Event tidak ditemukan");
            if (event.seats < quantity)
                throw new Error("Kuota event tidak mencukupi");
            // 2. Hitung Total
            let total = event.price * quantity;
            let pointsUsed = 0;
            // 3. Validasi Voucher
            if (options === null || options === void 0 ? void 0 : options.voucherCode) {
                const voucher = yield tx.voucher.findUnique({
                    where: {
                        code: options.voucherCode,
                        event_id: eventId
                    }
                });
                if (!voucher)
                    throw new Error("Voucher tidak ditemukan");
                if (voucher.current_usage >= voucher.max_usage)
                    throw new Error("Voucher sudah habis");
                total -= voucher.discount;
                yield tx.voucher.update({
                    where: { id: voucher.id },
                    data: { current_usage: { increment: 1 } }
                });
            }
            // 4. Validasi Coupon
            if (options === null || options === void 0 ? void 0 : options.couponCode) {
                const coupon = yield tx.coupon.findUnique({
                    where: { code: options.couponCode }
                });
                if (!coupon)
                    throw new Error("Coupon tidak ditemukan");
                if (coupon.current_usage >= coupon.max_usage)
                    throw new Error("Coupon sudah habis");
                total -= coupon.discount_percentage / 100 * total;
                total = Math.max(total, 0);
                yield tx.coupon.update({
                    where: { id: coupon.id },
                    data: { current_usage: { increment: 1 } }
                });
            }
            // 5. Validasi Points
            if (options === null || options === void 0 ? void 0 : options.usePoints) {
                const user = yield tx.users.findUnique({
                    where: { id: userId },
                    select: { user_points: true }
                });
                if (!user || user.user_points <= 0)
                    throw new Error("Poin tidak mencukupi");
                pointsUsed = Math.min(user.user_points, total);
                total -= pointsUsed;
                yield tx.users.update({
                    where: { id: userId },
                    data: { user_points: { decrement: pointsUsed } }
                });
            }
            // 6. Generate DOKU Payment
            const clientId = process.env.DOKU_CLIENT_ID;
            const secretKey = process.env.DOKU_SECRET_KEY;
            const requestId = crypto_1.default.randomUUID();
            const requestTimestamp = new Date().toISOString();
            const path = '/checkout/v1/payment';
            const order_id = `TRX-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const body = {
                order: {
                    amount: total,
                    invoice_number: order_id,
                    items: [{
                            name: event.name,
                            price: event.price,
                            quantity: quantity
                        }]
                },
                payment: {
                    payment_due_date: 60
                },
                customer: {
                    id: userId.toString()
                }
            };
            const signatureComponent = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${path}\n${JSON.stringify(body)}`;
            const signature = crypto_1.default.createHmac('sha256', secretKey)
                .update(signatureComponent)
                .digest('base64');
            const dokuUrl = process.env.DOKU_IS_PRODUCTION === 'true'
                ? 'https://api.doku.com/checkout/v1/payment'
                : 'https://api-sandbox.doku.com/checkout/v1/payment';
            const response = yield axios_1.default.post(dokuUrl, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Client-Id': clientId,
                    'Request-Id': requestId,
                    'Request-Timestamp': requestTimestamp,
                    'Signature': `HMACSHA256=${signature}`
                }
            });
            // 7. Simpan Transaksi
            const transaction = yield tx.transaction.create({
                data: {
                    user_id: userId,
                    event_id: eventId,
                    total_amount: total,
                    payment_method: 'doku',
                    status: 'waiting_for_payment',
                    doku_payment_id: response.data.payment.id,
                    doku_invoice: order_id,
                    doku_payment_url: response.data.payment.url,
                    quantity,
                    expired_at: new Date(Date.now() + 2 * 60 * 60 * 1000)
                }
            });
            // 8. Kurangi Kursi Event
            yield tx.event.update({
                where: { id: eventId },
                data: { seats: { decrement: quantity } }
            });
            return {
                transaction,
                payment_url: response.data.payment.url,
                points_used: pointsUsed
            };
        }));
    });
}
