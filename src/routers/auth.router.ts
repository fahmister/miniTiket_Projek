import { Router } from "express";
import type { Request, Response } from "express";
import { RegisterController, LoginController, UsersController, UpdateProfileController, UpdateProfileController2, ReferralController } from "../controllers/auth.controller";
import { VerifyToken, EOGuard } from "../middlewares/auth.middleware";
import ReqValidator from "../middlewares/validator.middleware";
import { registerSchema, loginSchema } from "../schemas/user.schema";
import { Multer } from "../utils/multer";
import prisma from "../lib/prisma"; 
import { sendReferralRewardEmail } from "../services/referralemail.service";

const router = Router();

// router for register
router.post("/register", ReqValidator(registerSchema), RegisterController);

// router for login
router.post("/login", ReqValidator(loginSchema), LoginController);

// use one of router.patch("/avatar")
// path for upload avatar in cloudinary
router.patch("/avatar", VerifyToken, Multer("memoryStorage").single("file"), UpdateProfileController);
// path for upload avatar in local storage (public folder)
router.patch("/avatar2", VerifyToken, Multer("diskStorage", "AVT", "AVATAR").single("file"), UpdateProfileController2);

// router for get all users
router.get("/", VerifyToken, EOGuard, UsersController);


// debugging route to test coupon creation
// This route is for testing purposes only and should not be used in production
router.post('/test/coupon', async (req, res) => {
    try {
      const coupon = await prisma.coupon.create({
        data: {
          user_id: 1, // Test with existing user ID
          code: `TEST-${Math.random().toString(36).substring(2, 8)}`,
          discount_percentage: 10,
          expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
          name: 'Test Coupon',
          max_usage: 1,
          current_usage: 0,
          creatAt: new Date()
        }
      });
      res.json(coupon);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  });


router.post('/test/email', async (req, res) => {
  try {
    await sendReferralRewardEmail(prisma, 1, 'test@example.com');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
});

router.post('/test/referral', ReferralController )

// exporting the router to be used in index.ts
export default router;