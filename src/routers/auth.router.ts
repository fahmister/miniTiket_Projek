import { Router } from "express";
import { RegisterController, LoginController, UsersController, ReferralController, UpdateProfileController, UpdateProfileController2 } from "../controllers/auth.controller";
import { VerifyToken, EOGuard } from "../middlewares/auth.middleware";
import ReqValidator from "../middlewares/validator.middleware";
import { registerSchema, loginSchema } from "../schemas/user.schema";
import { Multer } from "../utils/multer";

const router = Router();

// router for register
router.post("/register", ReqValidator(registerSchema), RegisterController);

router.get("/referral-code", ReferralController);

// router for login
router.post("/login", ReqValidator(loginSchema), LoginController);

// use one of router.patch("/avatar")
// path for upload avatar in cloudinary
router.patch("/avatar", VerifyToken, Multer("memoryStorage").single("file"), UpdateProfileController);
// path for upload avatar in local storage (public folder)
router.patch("/avatar2", VerifyToken, Multer("diskStorage", "AVT", "AVATAR").single("file"), UpdateProfileController2);

// router for get all users
router.get("/", VerifyToken, EOGuard, UsersController);

// exporting the router to be used in index.ts
export default router;