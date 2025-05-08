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
exports.createTransaction = createTransaction;
const prisma_1 = __importDefault(require("../lib/prisma"));
function createTransaction(userId, eventId, quantity, options) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
            // 1. Validasi Event
            const event = yield tx.event.findUnique({
                where: { id: eventId },
                select: {
                    seats: true,
                    price: true,
                    user_id: true
                }
            });
            if (!event) {
                throw new Error("Event tidak ditemukan");
            }
            if (event.seats < quantity) {
                throw new Error("Kuota event tidak mencukupi");
            }
            // 2. Dapatkan data user dan points
            const user = yield tx.users.findUnique({
                where: { id: userId },
                select: {
                    user_points: true,
                    id: true
                }
            });
            if (!user) {
                throw new Error("User tidak ditemukan");
            }
            // 3. Hitung Total
            let total = event.price * quantity;
            let pointsUsed = 0;
            // 4. Apply Voucher (jika ada)
            if (options === null || options === void 0 ? void 0 : options.voucherCode) {
                const voucher = yield tx.voucher.findUnique({
                    where: {
                        code: options.voucherCode,
                        event_id: eventId
                    }
                });
                if (!voucher) {
                    throw new Error("Voucher tidak ditemukan");
                }
                if (voucher.current_usage >= voucher.max_usage) {
                    throw new Error("Voucher sudah mencapai batas penggunaan");
                }
                total -= voucher.discount;
                // Update penggunaan voucher
                yield tx.voucher.update({
                    where: { id: voucher.id },
                    data: { current_usage: { increment: 1 } }
                });
            }
            // 5. Apply Coupon (jika ada)
            if (options === null || options === void 0 ? void 0 : options.couponCode) {
                const coupon = yield tx.coupon.findUnique({
                    where: { code: options.couponCode }
                });
                if (!coupon) {
                    throw new Error("Coupon tidak ditemukan");
                }
                if (coupon.current_usage >= coupon.max_usage) {
                    throw new Error("Coupon sudah mencapai batas penggunaan");
                }
                total -= coupon.discount_percentage / 100 * total;
                total = Math.max(total, 0); // Pastikan total tidak negatif
                // Update penggunaan coupon
                yield tx.coupon.update({
                    where: { id: coupon.id },
                    data: { current_usage: { increment: 1 } }
                });
            }
            // 6. Apply Points (jika dipilih)
            if (options === null || options === void 0 ? void 0 : options.usePoints) {
                if (user.user_points <= 0) {
                    throw new Error("Point user tidak mencukupi");
                }
                pointsUsed = Math.min(user.user_points, total);
                total -= pointsUsed;
                // Update point user
                yield tx.users.update({
                    where: { id: user.id },
                    data: { user_points: { decrement: pointsUsed } }
                });
            }
            // 7. Buat Transaksi
            const transaction = yield tx.transaction.create({
                data: {
                    status: "waiting_for_payment",
                    payment_date: new Date(),
                    total_amount: total,
                    payment_method: "transfer",
                    user_id: user.id
                }
            });
            // 8. Kurangi Stok Event
            yield tx.event.update({
                where: { id: eventId },
                data: { seats: { decrement: quantity } }
            });
            return {
                transaction,
                pointsUsed,
                finalAmount: total
            };
        }));
    });
}
