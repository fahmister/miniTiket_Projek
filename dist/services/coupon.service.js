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
exports.CouponCreation = CouponCreation;
const prisma_1 = __importDefault(require("../lib/prisma"));
function CouponCreation(params, tx) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = tx || prisma_1.default;
        try {
            const defaultCode = `WELCOME-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            const expiryDate = new Date(); // Initialize defaultExpiry as the current date
            expiryDate.setMonth(expiryDate.getMonth() + (params.validityMonths || 3)); // Set the expiry date to 3 months from now
            return yield client.coupon.create({
                data: {
                    user_id: params.userId, // Use the passed user.id
                    code: params.code || defaultCode, // Generate random coupon code
                    discount_percentage: params.discountPercentage || 10, // 10% discount
                    expiry_date: expiryDate,
                    name: params.couponName || 'Welcome Coupon', // Add a name for the coupon
                    max_usage: 10, // Set maximum usage for the coupon
                    current_usage: 0, // Set current usage to 0
                    creatAt: new Date() // Add the required creatAt field with the current timestamp as a Date object
                }
            });
        }
        catch (err) {
            console.error('Coupon creation failed:', err);
            throw err;
        }
    });
}
