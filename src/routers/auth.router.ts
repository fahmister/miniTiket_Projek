import { Router } from "express";
import { RegisterController, LoginController, UsersController, ReferralController } from "../controllers/auth.controller";
import { VerifyToken, EOGuard } from "../middlewares/auth.middleware";
import ReqValidator from "../middlewares/validator.middleware";
import { registerSchema, loginSchema } from "../schemas/user.schema";

const router = Router();

// router for register
router.post("/register", ReqValidator(registerSchema), RegisterController);

router.get("/referral-code", ReferralController);

// router for login
router.post("/login", ReqValidator(loginSchema), LoginController);

// router for get all users
router.get("/", VerifyToken, EOGuard, UsersController);

// exporting the router to be used in index.ts
export default router;