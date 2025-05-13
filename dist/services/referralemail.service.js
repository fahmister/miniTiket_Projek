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
exports.sendReferralRewardEmail = sendReferralRewardEmail;
const nodemailer_1 = require("../utils/nodemailer");
const handlebars_1 = __importDefault(require("handlebars"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
// This helper function of sendReferralRewardEmail inside RegisterService function 
function sendReferralRewardEmail(tx, referringUserId, newUserEmail) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const referringUser = yield tx.users.findUnique({
                where: { id: referringUserId },
                select: { email: true, first_name: true }
            });
            if (!referringUser) {
                console.error('Referring user not found');
                return;
            }
            const templatePath = path_1.default.join(__dirname, "../templates/referral-reward-notification.hbs");
            if (!fs_1.default.existsSync(templatePath)) {
                throw new Error(`Template file not found at: ${templatePath}`);
            }
            const templateSource = fs_1.default.readFileSync(templatePath, "utf-8");
            const compiledTemplate = handlebars_1.default.compile(templateSource);
            const html = compiledTemplate({
                name: referringUser.first_name,
                points: 10000,
                referredEmail: newUserEmail
            });
            // Send email to the referring user about their reward
            yield nodemailer_1.Transporter.sendMail({
                from: `Your Event TuneInLive <${config_1.NODEMAILER_USER || 'no-reply@yourapp.com'}>`,
                to: referringUser.email,
                subject: "You've earned referral points!",
                html,
                attachments: [{
                        filename: 'logo_miniTiket_v1.jpg',
                        path: path_1.default.join(__dirname, '../../public/logo/logo_miniTiket_v1.jpg'),
                        cid: 'logo' // same cid value as in the html img src of register-template.hbs
                    }]
            });
        }
        catch (emailError) {
            console.error('Error sending referral notification:', emailError);
            throw emailError;
        }
    });
}
