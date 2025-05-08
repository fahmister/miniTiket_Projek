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
exports.createVoucher = createVoucher;
const prisma_1 = __importDefault(require("../lib/prisma"));
function createVoucher(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { eventId } = req.params;
            const { code, discount, max_usage, expiry_date, name } = req.body;
            // Validasi input
            if (!code || !discount || !max_usage || !expiry_date) {
                throw new Error("Missing required fields");
            }
            // Cek event exists
            const event = yield prisma_1.default.event.findUnique({
                where: { id: eventId }
            });
            if (!event) {
                throw new Error("Event not found");
            }
            const voucher = yield prisma_1.default.voucher.create({
                data: {
                    event_id: eventId,
                    code,
                    name: name || `Discount ${discount}%`, // Default name jika tidak diisi
                    discount: Number(discount),
                    max_usage: Number(max_usage),
                    expiry_date: new Date(expiry_date),
                    current_usage: 0
                }
            });
            res.status(201).json({
                message: "Voucher created successfully",
                voucher
            });
        }
        catch (err) {
            next(err);
        }
    });
}
