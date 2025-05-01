import { Request, Response, NextFunction } from "express";
import { CouponCreation } from "../services/coupon.service";

async function CouponController(req: Request, res: Response, next: NextFunction) {
    try {
        const user = req.user as { id: number };
        // Ensure that req.body contains the necessary fields for coupon creation
        const coupon = await CouponCreation({ ...req.body, userId: user.id });
        res.status(200).send({
            message: "Coupon created successfully",
            data: coupon,
        });
        
    } catch (error) {
        next(error);
    }
}

export { CouponController };