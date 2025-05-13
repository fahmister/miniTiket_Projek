import { Prisma } from '@prisma/client';
import { CouponCreation } from "./coupon.service";
import { sendReferralRewardEmail } from "./referralemail.service";

// Helper function for referral rewards processing
// This function takes a transaction client, new user ID, referring user ID, and new user email as parameters
export async function processReferralRewards(
    tx: Prisma.TransactionClient,
    newUserId: number,
    referringUserId: number,
    newUserEmail: string
  ) {
    try {
      console.log(`Processing referral rewards for new user ${newUserId} referred by ${referringUserId}`);
      // 1. Create coupon for new user
      const coupon = await CouponCreation({
        userId: newUserId,
        discountPercentage: 10,
        validityMonths: 3,
        couponName: "Welcome Coupon"
      }, tx);

      console.log(`Created coupon: ${JSON.stringify(coupon)}`);
  
      // 2. Add points to referring user
      const updatedUser = await tx.users.update({
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

      await tx.pointTransactions.createMany({
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
      await sendReferralRewardEmail(tx, referringUserId, newUserEmail);
    } catch (error) {
      console.error('Referral reward processing failed:', error);
      throw error; // Re-throw to ensure transaction rolls back
    }
  }