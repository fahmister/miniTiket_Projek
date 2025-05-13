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
exports.EmailService = void 0;
const nodemailer_1 = require("../utils/nodemailer");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const handlebars_1 = __importDefault(require("handlebars"));
const config_1 = require("../config");
class EmailService {
    sendPasswordResetEmail(email, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const templatePath = path_1.default.join(__dirname, '../templates/password-reset.hbs');
                const templateSource = fs_1.default.readFileSync(templatePath, 'utf-8');
                const template = handlebars_1.default.compile(templateSource);
                // Update this to match your frontend login page with token parameter
                const resetLink = `${config_1.FE_URL}/login?token=${token}`;
                const html = template({ resetLink });
                yield nodemailer_1.Transporter.sendMail({
                    from: `Your Event TuneInLive <${config_1.NODEMAILER_USER || 'no-reply@yourapp.com'}>`,
                    to: email,
                    subject: 'Password Reset Request',
                    html,
                    attachments: [{
                            filename: 'logo_miniTiket_v1.jpg',
                            path: path_1.default.join(__dirname, '../../public/logo/logo_miniTiket_v1.jpg'),
                            cid: 'logo'
                        }]
                });
            }
            catch (error) {
                console.error('Error sending password reset email:', error);
                throw error;
            }
        });
    }
}
exports.EmailService = EmailService;
