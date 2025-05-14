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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPasswordService = void 0;
exports.FindUserByEmail = FindUserByEmail;
exports.GetAll = GetAll;
exports.RegisterService = RegisterService;
exports.ActivateUserService = ActivateUserService;
exports.LoginService = LoginService;
exports.UpdateUserService = UpdateUserService;
exports.VerifyUserService = VerifyUserService;
exports.verifyResetTokenService = verifyResetTokenService;
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcrypt_1 = require("bcrypt");
const cloudinary_1 = require("../utils/cloudinary");
const jsonwebtoken_1 = require("jsonwebtoken");
const referralrewards_services_1 = require("./referralrewards.services");
const verificationemail_service_1 = require("./verificationemail.service");
const password_service_1 = require("./password.service");
const passwordemail_service_1 = require("./passwordemail.service");
const config_1 = require("../config");
// Get all users from database via connection pool (prisma)
// Other application from GetAll is to see the history of event created by EO
function GetAll() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield prisma_1.default.users.findMany();
        }
        catch (err) {
            throw err;
        }
    });
}
// Function to find a user by email in database via connection pool (prisma)
// This function takes an email as a parameter and returns a promise of type Users | null
// It uses the Prisma Client to query the database for a user with the given email
function FindUserByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // find First is used to find the first record that matches the given criteria
            const users = yield prisma_1.default.users.findFirst({
                // select to get the specific fields to return
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    password: true,
                    roleId: true,
                    role: {
                        select: {
                            name: true,
                        },
                    },
                    profile_picture: true,
                    referral_code: true,
                    user_points: true,
                    discount_coupons: true,
                    expiry_points: true,
                    PointTransactions: {
                        where: { is_expired: false },
                        select: {
                            id: true,
                            amount: true,
                            expiry_date: true,
                            CreatedAt: true
                        }
                    },
                },
                where: {
                    email,
                },
                // lines 24 & 37-39 same as this query: select * from user where email = email limit 1
            });
            return users;
        }
        catch (err) {
            throw err;
        }
    });
}
// Function to register a new user
// This async function takes a parameter of type IRegisterParam and returns a promise of type Users
// Define a default role ID
const defaultRoleId = 1; // Replace 1 with the actual default role ID from your database
function RegisterService(param) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // validate email already registered and select * from user where email = email limit 1
            const isExist = yield FindUserByEmail(param.email);
            if (isExist)
                throw new Error("Email is already registered");
            // Create roles if they don't exist
            yield prisma_1.default.role.createMany({
                data: [
                    { id: 1, name: 'Customer' },
                    { id: 2, name: 'Event Organizer' }
                ],
                skipDuplicates: true
            });
            // hash the password using bcrypt (hash, getSaltSync)
            const salt = (0, bcrypt_1.genSaltSync)(10);
            const hashedPassword = yield (0, bcrypt_1.hash)(param.password, salt);
            // insert into user table in prisma database
            // (first_name, last_name, email, password, is_verified, etc) 
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Check if referral code exists if provided. 
                // User can provide a referral code when account registering or leave it empty
                let referringUserId = null;
                // 1. Check referral code 
                // If referral code is provided, find the user with that code
                if (param.referred_by) {
                    const referringUser = yield tx.users.findFirst({
                        where: {
                            referral_code: param.referred_by, // Match against referral_code
                            id: { not: param.id ? parseInt(param.id, 10) : undefined } // Ensure user can't refer themselves
                        }
                    });
                    if (!referringUser) {
                        throw new Error('Invalid referral code');
                    }
                    referringUserId = referringUser.id;
                }
                // Check if the referring user exists in the database
                const referringUserExists = yield prisma_1.default.users.findUnique({
                    where: { referral_code: param.referred_by }
                });
                console.log('Referring user exists:', referringUserExists);
                // ensure the referral code is valid and not empty
                console.log('Attempting to use referral code:', param.referred_by);
                // Additional Validation referred_by
                if (param.referred_by) {
                    const codeValid = yield prisma_1.default.users.count({
                        where: { referral_code: param.referred_by }
                    });
                    if (codeValid === 0) {
                        throw new Error('The referral code does not exist');
                    }
                }
                // 2. Create user - changed referred_by to use number directly
                const user = yield tx.users.create({
                    data: {
                        first_name: param.first_name,
                        last_name: param.last_name,
                        email: param.email,
                        password: hashedPassword,
                        is_verified: false,
                        roleId: param.roleId || defaultRoleId, // Default role ID or User can provide a custom one (2)
                        user_points: 0, // Default value for user_points
                        expiry_points: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months expiry,
                        referred_by: referringUserId,
                        referral_code: "",
                    },
                });
                // lines 119-133 insert into user table in prisma database
                // 3. Generate and update the user's own referral code
                const finalReferralCode = `TIX-${user.id.toString().padStart(6, '0')}`;
                yield tx.users.update({
                    where: { id: user.id },
                    data: { referral_code: finalReferralCode },
                });
                // 4. Process referral rewards if applicable
                if (referringUserId) {
                    try {
                        yield (0, referralrewards_services_1.processReferralRewards)(tx, user.id, referringUserId, user.email);
                    }
                    catch (referralError) {
                        console.error('Referral reward processing failed:', referralError);
                        // Continue registration even if rewards fail
                    }
                }
                // Generate verification token
                // payload is the data that will be included in the JWT token
                const payload = { email: user.email };
                const token = (0, jsonwebtoken_1.sign)(payload, String(config_1.SECRET_KEY), { expiresIn: "15m" });
                // 5. Send verification notification email
                yield (0, verificationemail_service_1.sendVerificationEmail)(param.email, token);
                return user;
            }), {
                maxWait: 20000, // Maximum time to wait for the transaction (20 seconds)
                timeout: 15000 // Maximum time the transaction can run (15 seconds)
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });
}
// function to activate user account
// This function takes a token as a parameter and returns a promise of type Users | null
function ActivateUserService(token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Verify the JWT token
            const decoded = (0, jsonwebtoken_1.verify)(token, String(config_1.SECRET_KEY));
            // Reject if this is a password reset token
            if (decoded.type === 'password_reset') {
                throw new Error("Invalid activation token");
            }
            // First, check if user exists
            const user = yield prisma_1.default.users.findUnique({
                where: { email: decoded.email }
            });
            if (!user) {
                throw new Error("User not found");
            }
            // If already verified, return success response
            if (user.is_verified) {
                return {
                    success: true,
                    message: "Account was already verified",
                    user
                };
            }
            // Update the user's verification status
            const updatedUser = yield prisma_1.default.users.update({
                where: {
                    email: decoded.email
                },
                data: {
                    is_verified: true
                }
            });
            return {
                success: true,
                message: "Account successfully activated",
                user: updatedUser
            };
        }
        catch (err) {
            // Handle different error cases
            if (err instanceof jsonwebtoken_1.TokenExpiredError) {
                throw new Error("Activation link has expired");
            }
            else if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
                throw new Error("Invalid activation token");
            }
            throw err;
        }
    });
}
function LoginService(param) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const users = yield FindUserByEmail(param.email);
            if (!users)
                throw new Error("Email is not registered");
            // compare is used to compare the password from user input with the hashed password in the database
            const checkPass = yield (0, bcrypt_1.compare)(param.password, users.password);
            if (!checkPass)
                throw new Error("Incorrect password");
            // payload is the data that will be included in the JWT token
            const payload = {
                id: users.id,
                email: users.email,
                first_name: users.first_name,
                last_name: users.last_name,
                roleName: users.role.name,
                profile_picture: users.profile_picture || "", // Ensure profile_picture is optional
                referral_code: users.referral_code, // Add these
                user_points: users.user_points,
                expiry_points: users.expiry_points,
                discount_coupons: users.discount_coupons || [],
                PointTransactions: users.PointTransactions
            };
            // sign is used to create a JWT token with the user's informatio
            // The token is signed with a secret key and has an expiration time of 1 hour
            const token = (0, jsonwebtoken_1.sign)(payload, String(config_1.SECRET_KEY), { expiresIn: "1h" });
            return { user: payload, token };
        }
        catch (err) {
            throw err;
        }
    });
}
function UpdateUserService(file, email) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const checkUser = yield FindUserByEmail(email);
            if (!checkUser)
                throw new Error("User not found");
            // Upload to Cloudinary
            const { secure_url } = yield (0, cloudinary_1.cloudinaryUpload)(file);
            if (!secure_url) {
                throw new Error("Failed to upload to Cloudinary");
            }
            const splitUrl = secure_url.split("/");
            // splitUrl.length - 1 to get the last part of the URL
            const fileName = splitUrl.slice(-2).join('/');
            const result = yield prisma_1.default.$transaction((t) => __awaiter(this, void 0, void 0, function* () {
                // where is used to find the user by email and update the profile_picture field with the fileName
                yield t.users.update({
                    where: {
                        email: email
                    },
                    data: {
                        profile_picture: fileName
                    },
                });
                return secure_url; // Return the full URL for the controller to process
            }));
            return result; // Ensure the function always returns the secure_url
        }
        catch (err) {
            throw err;
        }
    });
}
// async function UpdateUserService2(file: Express.Multer.File, email: string) {
//   try {
//     const checkUser = await FindUserByEmail(email);
//     if (!checkUser) throw new Error("User not found");
//     await prisma.$transaction(async (t: any) => {
//       await t.users.update({
//         where: {
//           email: checkUser.email,
//         },
//         data: {
//           profile_picture: file.filename,
//         },
//       });
//     });
//   } catch (err) {
//     throw err;
//   }
// }
function VerifyUserService() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("this function is running");
            yield prisma_1.default.$transaction((t) => __awaiter(this, void 0, void 0, function* () {
                yield t.users.updateMany({
                    where: {
                        is_verified: false
                    },
                    data: {
                        is_verified: true,
                    },
                });
            }));
        }
        catch (err) {
            throw err;
        }
    });
}
const passwordService = new password_service_1.PasswordService();
const emailService = new passwordemail_service_1.EmailService();
class UserPasswordService {
    changePassword(userId, currentPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.default.users.findUnique({
                where: { id: userId },
                select: { password: true }
            });
            if (!user) {
                throw new Error('User not found');
            }
            const isMatch = yield passwordService.comparePasswords(currentPassword, user.password);
            if (!isMatch) {
                throw new Error('Current password is incorrect');
            }
            const hashedPassword = yield passwordService.hashPassword(newPassword);
            yield prisma_1.default.users.update({
                where: { id: userId },
                data: { password: hashedPassword }
            });
        });
    }
    requestPasswordReset(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.default.users.findUnique({
                where: { email },
                select: { id: true, email: true }
            });
            if (!user) {
                // Don't reveal whether user exists for security
                return;
            }
            const resetToken = yield passwordService.generateResetToken(user.id);
            yield emailService.sendPasswordResetEmail(user.email, resetToken);
        });
    }
    resetPassword(token, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId } = yield passwordService.verifyResetToken(token);
            const hashedPassword = yield passwordService.hashPassword(newPassword);
            yield prisma_1.default.$transaction([
                prisma_1.default.users.update({
                    where: { id: userId },
                    data: { password: hashedPassword }
                }),
                prisma_1.default.passwordResetToken.deleteMany({
                    where: { userId }
                })
            ]);
        });
    }
}
exports.UserPasswordService = UserPasswordService;
function verifyResetTokenService(token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!token) {
                throw new Error("Token is required");
            }
            // First verify the JWT
            const decoded = (0, jsonwebtoken_1.verify)(token, String(config_1.SECRET_KEY));
            // Then check if the token exists in the database and isn't expired
            const resetToken = yield prisma_1.default.passwordResetToken.findFirst({
                where: {
                    token,
                    expiresAt: { gt: new Date() }
                }
            });
            if (!resetToken) {
                throw new Error("Invalid or expired token");
            }
            return { valid: true, userId: decoded.userId };
        }
        catch (err) {
            if (err instanceof jsonwebtoken_1.TokenExpiredError) {
                throw new Error("Token has expired");
            }
            else if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
                throw new Error("Invalid token");
            }
            throw err; // Re-throw other errors
        }
    });
}
