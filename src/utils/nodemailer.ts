import nodemailer from "nodemailer";
import { NODEMAILER_USER, NODEMAILER_PASS } from "../config";

// Create Transporter using gmail service
export const Transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: NODEMAILER_USER,
        pass: NODEMAILER_PASS
    }
});