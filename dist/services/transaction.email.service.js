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
exports.sendTransactionStatusEmail = sendTransactionStatusEmail;
const nodemailer_1 = require("../utils/nodemailer");
const handlebars_1 = __importDefault(require("handlebars"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
function sendTransactionStatusEmail(transaction, status, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const templatePath = path_1.default.join(__dirname, `../templates/transaction-${status}.hbs`);
            const templateSource = fs_1.default.readFileSync(templatePath, "utf-8");
            const compiledTemplate = handlebars_1.default.compile(templateSource);
            const html = compiledTemplate({
                name: transaction.user.first_name,
                eventName: transaction.event.name,
                quantity: transaction.quantity,
                totalAmount: transaction.total_amount.toFixed(2),
                transactionId: transaction.id,
                reason: reason || "Payment verification failed",
                pointsRestored: transaction.point_used,
                couponRestored: transaction.coupon_code
            });
            yield nodemailer_1.Transporter.sendMail({
                from: `TuneInLive Events <${config_1.NODEMAILER_USER}>`,
                to: transaction.user.email,
                subject: status === 'approved'
                    ? "Payment Approved - Tickets Confirmed!"
                    : "Payment Declined - Action Required",
                html,
                attachments: [ /* logo attachment */]
            });
        }
        catch (error) {
            console.error("Error sending transaction email:", error);
            throw error;
        }
    });
}
