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
exports.PasswordService = void 0;
const bcrypt_1 = require("bcrypt");
const jsonwebtoken_1 = require("jsonwebtoken");
const config_1 = require("../config");
const prisma_1 = __importDefault(require("../lib/prisma"));
class PasswordService {
    comparePasswords(plainPassword, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, bcrypt_1.compare)(plainPassword, hashedPassword);
        });
    }
    hashPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            const saltRounds = 10;
            return (0, bcrypt_1.hash)(password, saltRounds);
        });
    }
    generateResetToken(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const resetToken = (0, jsonwebtoken_1.sign)({ userId,
                type: 'password_reset' // Add this to distinguish from other tokens
            }, config_1.SECRET_KEY || 'default_secret_key', { expiresIn: '1h' });
            yield prisma_1.default.passwordResetToken.create({
                data: {
                    userId,
                    token: resetToken,
                    expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
                }
            });
            return resetToken;
        });
    }
    verifyResetToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!config_1.SECRET_KEY) {
                throw new Error('SECRET_KEY is not defined');
            }
            const decoded = (0, jsonwebtoken_1.verify)(token, config_1.SECRET_KEY);
            const resetToken = yield prisma_1.default.passwordResetToken.findFirst({
                where: {
                    userId: decoded.userId,
                    token,
                    expiresAt: { gt: new Date() }
                }
            });
            if (!resetToken) {
                throw new Error('Invalid or expired token');
            }
            return { userId: decoded.userId };
        });
    }
}
exports.PasswordService = PasswordService;
