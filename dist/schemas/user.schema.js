"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// Schema for user registration and login
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address').trim(),
    password: zod_1.z.string().nonempty('Password is required'),
    first_name: zod_1.z.string().nonempty('First name is required'),
    last_name: zod_1.z.string().nonempty('Last name is required'),
    roleId: zod_1.z.number().nonnegative("Invalid Role"),
    referred_by: zod_1.z.string()
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address').trim(),
    password: zod_1.z.string().nonempty('Password is required'),
});
