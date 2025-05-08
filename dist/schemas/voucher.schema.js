"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voucherSchema = void 0;
const zod_1 = require("zod");
exports.voucherSchema = zod_1.z.object({
    code: zod_1.z.string().min(3).max(10),
    discount: zod_1.z.number().positive(),
    max_usage: zod_1.z.number().int().positive(),
    expiry_date: zod_1.z.string().datetime(),
    name: zod_1.z.string().optional(),
});
