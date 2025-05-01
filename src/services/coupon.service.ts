import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";
import type { ICouponParams } from "../custom.d.ts";

async function CouponCreation(
    params: ICouponParams, 
    tx?: Prisma.TransactionClient
): Promise<Prisma.CouponGetPayload<any>> {
    const client = tx || prisma;

    try {
        const defaultCode = `WELCOME-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const defaultExpiry = new Date(); // Initialize defaultExpiry as the current date
        defaultExpiry.setMonth(defaultExpiry.getMonth() + (3));
        
        return await client.coupon.create({
            data: {
                user_id: params.userId, // Use the passed user.id
                code: params.code || defaultCode, // Generate random coupon code
                discount_percentage: params.discountPercentage || 10, // 10% discount
                expiry_date: defaultExpiry, // 3 months validity
                description: params.couponName || 'Register reward from referral program',
                name: 'Welcome Coupon', // Add a name for the coupon
                max_usage: 100, // Set maximum usage for the coupon
                current_usage: 0, // Set current usage to 0
                creatAt: new Date().getTime() // Add the required creatAt field with the current timestamp as a number
                }
            });
        } catch (err) {
        console.error('Coupon creation failed:', err);
        throw err;
    }
}

export { CouponCreation };