import prisma from "../lib/prisma";
import { z } from 'zod';


// Flexible ID validation based on your schema
const userIdSchema = z.union([
  z.string().uuid(),       // For UUID strings
  z.string().regex(/^\d+$/).transform(Number),  // For numeric IDs passed as strings
  z.number()               // For numeric IDs
]);

export function generateReferralCode(userId: string | number): string {
  const prefix = 'TIX';
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${randomPart}-${String(userId).substring(0, 4)}`;
}

export async function createReferralCode(userId: unknown): Promise<string> {
  try {
    // Validate and normalize the ID
    const validation = userIdSchema.safeParse(userId);
    if (!validation.success) {
      throw new Error(`Invalid user ID: ${JSON.stringify(validation.error.issues)}`);
    }

    const normalizedId = validation.data;

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: typeof normalizedId === 'number' ? normalizedId : undefined },
      select: { id: true }
    });

    if (!user) {
      throw new Error(`User with ID ${normalizedId} not found`);
    }

    // Generate unique referral code
    let referralCode: string;
    let attempts = 0;
    
    do {
      referralCode = generateReferralCode(normalizedId);
      const exists = await prisma.users.findFirst({
        where: { referral_code: referralCode },
        select: { id: true }
      });
      if (!exists) break;
      attempts++;
    } while (attempts < 5);

    if (attempts >= 5) {
      throw new Error('Failed to generate unique referral code');
    }

    // Update user
    // await prisma.users.update({
    //   where: { id: typeof normalizedId === 'number' ? normalizedId : undefined },
    //   data: { referral_code: referralCode },
    // });

    return referralCode;
  } catch (error) {
    console.error('Referral code creation failed:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Unknown error during referral code creation'
    );
  }
}