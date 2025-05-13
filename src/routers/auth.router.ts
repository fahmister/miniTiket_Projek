import { Router } from "express";
import { 
        RegisterController, 
        ActivationController,
        LoginController, 
        EODashboardController,
        GetAllController, 
        UpdateProfileController, 
        // UpdateProfileController2, 
        AuthPasswordController,
        VerifyResetTokenController,
        getCurrentUserController
        } from "../controllers/auth.controller";

import { VerifyToken, EOGuard } from "../middlewares/auth.middleware";
import ReqValidator from "../middlewares/validator.middleware";
import { registerSchema, loginSchema } from "../schemas/user.schema";
import { Multer } from "../utils/multer";

const router = Router();

// router for register
router.post("/register", ReqValidator(registerSchema), RegisterController);

// router for activation after register
router.get("/activate/:token", ActivationController);

// router for login
router.post("/login", ReqValidator(loginSchema), LoginController);

// router for Authorization testing of EO in Postman
router.get("/eo-dashboard", VerifyToken, EOGuard, EODashboardController)

// use one of router.patch("/avatar")
// path for upload avatar in cloudinary
router.patch("/avatar", VerifyToken, Multer("memoryStorage").single("file"), UpdateProfileController);
// path for upload avatar in local storage (public folder)
// router.patch("/avatar2", VerifyToken, Multer("diskStorage", "AVT", "AVATAR").single("file"), UpdateProfileController2);

// router for get current user
// This route is used to get the current user's information
router.get("/me", VerifyToken, getCurrentUserController);
// router for get all users
router.get("/users", VerifyToken, EOGuard, GetAllController);

// Password change - requires authentication
router.post('/change-password', VerifyToken, AuthPasswordController.changePassword);

// Password reset routes
router.post('/request-password-reset', AuthPasswordController.requestPasswordReset);
router.post('/reset-password', AuthPasswordController.resetPassword);

router.post("/verify-reset-token", VerifyResetTokenController)

// exporting the router to be used in index.ts
export default router;