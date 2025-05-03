import { Router } from "express";
import { RegisterController, LoginController, UsersController, UpdateProfileController, UpdateProfileController2, AuthPasswordController } from "../controllers/auth.controller";
import { VerifyToken, EOGuard } from "../middlewares/auth.middleware";
import ReqValidator from "../middlewares/validator.middleware";
import { registerSchema, loginSchema } from "../schemas/user.schema";
import { Multer } from "../utils/multer";

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

// Password change - requires authentication
router.post('/change-password', VerifyToken, AuthPasswordController.changePassword);

// Password reset routes
router.post('/request-password-reset', AuthPasswordController.requestPasswordReset);
router.post('/reset-password', AuthPasswordController.resetPassword);

// exporting the router to be used in index.ts
export default router;