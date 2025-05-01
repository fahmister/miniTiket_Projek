import { Router } from "express";
import { VerifyToken } from "../middlewares/auth.middleware";
import { CouponController } from "../controllers/coupon.controller";

const router = Router();

// router for coupon creation
router.post('/', VerifyToken, CouponController )


export default router;