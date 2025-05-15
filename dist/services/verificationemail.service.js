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
exports.sendVerificationEmail = sendVerificationEmail;
// 1. Handlebars is template engine, 2. path to join path with the file name and 3. fs to read and manipulate files
const handlebars_1 = __importDefault(require("handlebars"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const nodemailer_1 = require("../utils/nodemailer");
const config_1 = require("../config");
// Helper function for verification email
function sendVerificationEmail(email, token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Construct the path to the template file
            const templatePath = path_1.default.join(__dirname, "../templates/register-template.hbs");
            if (fs_1.default.existsSync(templatePath)) {
                const templateSource = fs_1.default.readFileSync(templatePath, "utf-8");
                const compiledTemplate = handlebars_1.default.compile(templateSource);
                const html = compiledTemplate({
                    email: email,
                    fe_url: `${config_1.FE_URL}/activation?token=${token}`, // Replace with your frontend URL
                });
                yield nodemailer_1.Transporter.sendMail({
                    from: `Your Event TuneInLive <${config_1.NODEMAILER_USER || 'no-reply@yourapp.com'}>`,
                    to: email,
                    subject: "Welcome - Verify Your Account",
                    html,
                    attachments: [{
                            filename: 'logo_miniTiket_v1.jpg',
                            path: path_1.default.join(__dirname, '../../public/logo/logo_miniTiket_v1.jpg'),
                            cid: 'logo' // same cid value as in the html img src of register-template.hbs
                        }]
                });
            }
            else {
                console.error('Template file not found at:', templatePath);
            }
        }
        catch (emailError) {
            console.error('Error sending verification email:', emailError);
        }
    });
}
