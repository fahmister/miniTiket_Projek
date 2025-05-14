"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthPasswordController = void 0;
exports.RegisterController = RegisterController;
exports.ActivationController = ActivationController;
exports.LoginController = LoginController;
exports.EODashboardController = EODashboardController;
exports.GetAllController = GetAllController;
exports.UpdateProfileController = UpdateProfileController;
exports.getCurrentUserController = getCurrentUserController;
exports.VerifyResetTokenController = VerifyResetTokenController;
const auth_service_1 = require("../services/auth.service");
const jsonwebtoken_1 = require("jsonwebtoken");
// RegisterController function to handle user registration
// It takes the request, response, and next function as parameters
// If an error occurs, it calls the next function to handle the error
function RegisterController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Validate the request body using the IRegisterParam interface
            // This ensures that the request body contains the required fields for registration
            const data = yield (0, auth_service_1.RegisterService)(req.body);
            const roleId = typeof req.body.roleId === 'string'
                ? parseInt(req.body.roleId)
                : req.body.roleId;
            // Validate roleId is 1 or 2
            if (![1, 2].includes(roleId)) {
                res.status(400).send({ error: "Invalid role ID" });
            }
            res.status(200).send({
                message: "Register Successfully",
                data
            });
        }
        catch (err) {
            next(err);
        }
    });
}
function ActivationController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, auth_service_1.ActivateUserService)(req.params.token);
            res.status(200).json(result);
        }
        catch (err) {
            if (err instanceof Error) {
                res.status(400).json({ err: err.message });
            }
            else {
                res.status(400).json({ err: "An unknown error occurred" });
            }
            next(err);
        }
    });
}
function LoginController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield (0, auth_service_1.LoginService)(req.body);
            const { user, token } = data; // Extract user and token from data
            // Set secure, httpOnly cookie
            res.cookie('access_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7 * 1000 // 1 week
            });
            res.status(200).json({
                message: "Login successful",
                token: token, // Ensure the token is returned from LoginService
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    roleName: user.roleName // Ensure roleName is used correctly
                }
            });
        }
        catch (err) {
            next(err);
        }
    });
}
// In Postman, Authorization testing
function EODashboardController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            res.status(200).json({
                message: "Welcome to Event Organizer Dashboard",
                user: req.user
            });
        }
        catch (err) {
            next(err);
        }
    });
}
function UpdateProfileController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { file } = req;
            const { email } = req.user;
            if (!file)
                throw new Error("file not found");
            // This now returns the Cloudinary filename
            const cloudinaryUrl = yield (0, auth_service_1.UpdateUserService)(file, email);
            if (typeof cloudinaryUrl !== 'string' || !cloudinaryUrl) {
                throw new Error("Invalid response from UpdateUserService");
            }
            const splitUrl = cloudinaryUrl.split('/');
            const cloudinaryPath = splitUrl.slice(splitUrl.indexOf('upload') + 1).join('/');
            res.status(200).send({
                message: "Profile update successfully",
                fileName: cloudinaryPath // e.g. "v12345/profile.jpg"
            });
        }
        catch (err) {
            next(err);
        }
    });
}
function getCurrentUserController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!req.user) {
                res.status(400).json({ message: "User is not authenticated" });
                return;
            }
            const user = yield (0, auth_service_1.FindUserByEmail)(req.user.email);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            // Return necessary user data without sensitive information
            const userData = {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                profile_picture: user.profile_picture || null, // Ensure profile_picture is optional
                roleName: user.role.name,
                referral_code: user.referral_code,
                user_points: user.user_points,
                discount_coupons: user.discount_coupons,
                expiry_points: user.expiry_points,
                PointTransactions: user.PointTransactions,
            };
            res.status(200).json(userData);
        }
        catch (err) {
            next(err);
        }
    });
}
// async function UpdateProfileController2(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) {
//   try {
//     const { file } = req;
//     const { email } = req.user as IUserReqParam;
//     // console.log(file);
//     if (!file) throw new Error("file not found");
//     await UpdateUserService2(file, email);
//     res.status(200).send({
//       message: "Profile update successfully",
//     });
//   } catch (err) {
//     next(err);
//   }
// }
function GetAllController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = req.user;
            console.log(user);
            const data = yield (0, auth_service_1.GetAll)();
            res.status(200).send({
                message: "Successfully get all users",
                users: data
            });
        }
        catch (err) {
            next(err);
        }
    });
}
const authService = new auth_service_1.UserPasswordService();
exports.AuthPasswordController = {
    changePassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { currentPassword, newPassword } = req.body;
                if (!req.user) {
                    res.status(400).send({ message: 'User is not authenticated' });
                    return;
                }
                const userId = req.user.id;
                if (typeof userId !== 'number') {
                    res.status(400).send({ message: 'Invalid user ID' });
                    return;
                }
                yield authService.changePassword(userId, currentPassword, newPassword);
                res.status(200).json({ message: "Password Changed Successfully" });
            }
            catch (err) {
                console.error('Password change error:', err);
                if (err instanceof Error && err.message === 'User not found') {
                    res.status(404).send({ message: err.message });
                }
                if (err instanceof Error && err.message === 'Current password is incorrect') {
                    res.status(400).send({ message: err.message });
                }
                next(err);
            }
        });
    },
    requestPasswordReset(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                yield authService.requestPasswordReset(email);
                res.status(200).send({ message: 'If an account with that email exists, a password reset link has been sent' });
            }
            catch (err) {
                console.error('Password reset request error:', err);
                next();
            }
        });
    },
    resetPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { token, newPassword } = req.body;
                yield authService.resetPassword(token, newPassword);
                res.status(200).send({ message: 'Password reset successfully' });
            }
            catch (err) {
                console.error('Password reset error:', err);
                if (err instanceof Error && err.message === 'Invalid or expired token') {
                    res.status(400).send({ message: err.message });
                }
                next();
            }
        });
    }
};
function VerifyResetTokenController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { token } = req.body;
            if (!token) {
                res.status(400).json({ error: "Token is required" });
            }
            const result = yield (0, auth_service_1.verifyResetTokenService)(token);
            res.status(200).json(result);
        }
        catch (err) {
            console.error('Token verification error:', err);
            if (err instanceof jsonwebtoken_1.TokenExpiredError) {
                res.status(400).json({ error: "Token has expired" });
            }
            else if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
                res.status(400).json({ error: "Invalid token" });
            }
            else if (err.message.includes('Invalid') || err.message.includes('expired')) {
                res.status(400).json({ error: err.message });
            }
            next(err);
            res.status(500).json({ error: "Internal server error" });
        }
    });
}
