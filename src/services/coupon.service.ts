import prisma from "../lib/prisma";

async function CouponCreation(userId: number, body: any): Promise<any> {
    try {
      const coupon = await prisma.coupon.create({
        data: {
            user_id: 1, // Test user ID
            code: `TEST-${Math.random().toString(36).substring(2, 8)}`,
            discount_percentage: 10,
            expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
            name: 'Test Coupon',
            max_usage: 1,
            current_usage: 0,
            creatAt: new Date().getTime() // Adding the required creatAt field as a timestamp
            }
        });
        
        return coupon;
        
        } catch (err) {
        throw new Error(`Failed to create coupon: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
}

export { CouponCreation }