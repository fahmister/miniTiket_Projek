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
exports.processReferralRewards = processReferralRewards;
const coupon_service_1 = require("./coupon.service");
const referralemail_service_1 = require("./referralemail.service");
// Helper function for referral rewards processing
// This function takes a transaction client, new user ID, referring user ID, and new user email as parameters
function processReferralRewards(tx, newUserId, referringUserId, newUserEmail) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`Processing referral rewards for new user ${newUserId} referred by ${referringUserId}`);
            // 1. Create coupon for new user
            const coupon = yield (0, coupon_service_1.CouponCreation)({
                userId: newUserId,
                discountPercentage: 10,
                validityMonths: 3,
                couponName: "Welcome Coupon"
            }, tx);
            console.log(`Created coupon: ${JSON.stringify(coupon)}`);
            // 2. Add points to referring user
            const updatedUser = yield tx.users.update({
                where: { id: referringUserId },
                data: {
                    user_points: { increment: 10000 }
                }
            });
            console.log(`Updated referring user points: ${updatedUser.user_points}`);
            // 3. Create transaction records
            // Create points transaction with expiration
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 3);
            yield tx.pointTransactions.createMany({
                data: [
                    {
                        userId: newUserId,
                        amount: 0,
                        type: 'REFERRAL_COUPON',
                        description: 'Received welcome discount coupon',
                        expiry_date: expiryDate
                    },
                    {
                        userId: referringUserId,
                        amount: 10000,
                        type: 'REFERRAL_BONUS_POINTS',
                        description: `Referral bonus from ${newUserEmail}`,
                        expiry_date: expiryDate
                    }
                ]
            });
            // 4. Send notification email
            yield (0, referralemail_service_1.sendReferralRewardEmail)(tx, referringUserId, newUserEmail);
        }
        catch (error) {
            console.error('Referral reward processing failed:', error);
            throw error; // Re-throw to ensure transaction rolls back
        }
    });
}
