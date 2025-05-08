"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validator_middleware_1 = __importDefault(require("../middlewares/validator.middleware"));
const user_schema_1 = require("../schemas/user.schema");
const multer_1 = require("../utils/multer");
const router = (0, express_1.Router)();
// router for register
router.post("/register", (0, validator_middleware_1.default)(user_schema_1.registerSchema), auth_controller_1.RegisterController);
// router for login
router.post("/login", (0, validator_middleware_1.default)(user_schema_1.loginSchema), auth_controller_1.LoginController);
// use one of router.patch("/avatar")
// path for upload avatar in cloudinary
router.patch("/avatar", auth_middleware_1.VerifyToken, (0, multer_1.Multer)("memoryStorage").single("file"), auth_controller_1.UpdateProfileController);
// path for upload avatar in local storage (public folder)
router.patch("/avatar2", auth_middleware_1.VerifyToken, (0, multer_1.Multer)("diskStorage", "AVT", "AVATAR").single("file"), auth_controller_1.UpdateProfileController2);
// router for get all users
router.get("/users", auth_middleware_1.VerifyToken, auth_middleware_1.EOGuard, auth_controller_1.GetAllController);
// Password change - requires authentication
router.post('/change-password', auth_middleware_1.VerifyToken, auth_controller_1.AuthPasswordController.changePassword);
// Password reset routes
router.post('/request-password-reset', auth_controller_1.AuthPasswordController.requestPasswordReset);
router.post('/reset-password', auth_controller_1.AuthPasswordController.resetPassword);
// exporting the router to be used in index.ts
exports.default = router;
