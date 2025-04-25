import { PrismaClient } from '@prisma/client';

export class ReferralService {
  private static readonly REFERRAL_CODE_LENGTH = 8;
  private static prisma = new PrismaClient();

  // Generate a random referral code (unchanged)
  private static generateRandomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < this.REFERRAL_CODE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Updated to accept string IDs (UUIDs)
  public static async createReferralCode(userId: string): Promise<string> {
    try {
      // 1. First verify user exists
      const user = await this.prisma.users.findUnique({
        where: { id: userId } // No conversion needed for UUID
      });

      if (!user) {
        console.error(`User not found - ID: ${userId}`);
        throw new Error(`User with ID ${userId} not found`);
      }

      // 2. Return existing code if present
      if (user.referral_code) {
        return user.referral_code;
      }

      // 3. Generate new unique code
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        attempts++;
        const code = this.generateRandomCode();

        try {
          const updatedUser = await this.prisma.$transaction(async (tx) => {
            const existing = await tx.users.findFirst({
              where: { referral_code: code },
              select: { id: true }
            });

            if (existing) return null;

            return await tx.users.update({
              where: { id: userId }, // No conversion needed
              data: { referral_code: code }
            });
          });

          if (updatedUser) {
            return code;
          }
        } catch (updateError) {
          console.error('Update failed on attempt', attempts, updateError);
        }
      }

      throw new Error('Failed to generate unique code after 10 attempts');
    } catch (error) {
      console.error('Error in createReferralCode:', error);
      throw error;
    }
  }}