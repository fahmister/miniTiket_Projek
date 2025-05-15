"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../config");
// Create Transporter using gmail service
exports.Transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: config_1.NODEMAILER_USER,
        pass: config_1.NODEMAILER_PASS
    }
});
