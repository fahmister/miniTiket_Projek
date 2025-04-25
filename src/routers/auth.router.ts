import { Router } from "express";
import { RegisterController, LoginController, UsersController, getReferralCode } from "../controllers/auth.controller";
import { VerifyToken, EOGuard } from "../middlewares/auth.middleware";
import { get } from "http";

const router = Router();

// router for register
router.post("/register", RegisterController);

router.get("/referral-code", getReferralCode);

// router for login
router.post("/login", LoginController);

// router for get all users
router.get("/", VerifyToken, EOGuard, UsersController);

// exporting the router to be used in index.ts
export default router;