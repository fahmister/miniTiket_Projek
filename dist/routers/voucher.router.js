"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const voucher_controllers_1 = require("../controllers/voucher.controllers");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validator_middleware_1 = __importDefault(require("../middlewares/validator.middleware"));
const voucher_schema_1 = require("../schemas/voucher.schema"); // Anda perlu membuat schema ini
const router = (0, express_1.Router)();
router.post("/events/:eventId/vouchers", auth_middleware_1.VerifyToken, auth_middleware_1.EOGuard, (0, validator_middleware_1.default)(voucher_schema_1.voucherSchema), voucher_controllers_1.createVoucher);
exports.default = router;
