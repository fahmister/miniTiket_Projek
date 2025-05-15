import { Transporter } from "../utils/nodemailer";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { NODEMAILER_USER } from "../config";
import { Transaction, Users } from "@prisma/client";

export async function sendTransactionStatusEmail(
  transaction: Transaction & { user: Users, event: { name: string } },
  status: 'approved' | 'rejected',
  reason?: string
) {
  try {
    const templatePath = path.join(
      process.cwd(),
      'dist/src/templates', // Now points to copied files in dist
      `transaction-${status}.hbs`
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template not found at ${templatePath}`);
    }

    const templateSource = fs.readFileSync(templatePath, "utf-8");
    const compiledTemplate = Handlebars.compile(templateSource);
    
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

    await Transporter.sendMail({
      from: `TuneInLive Events <${NODEMAILER_USER}>`,
      to: transaction.user.email,
      subject: status === 'approved' 
        ? "Payment Approved - Tickets Confirmed!" 
        : "Payment Declined - Action Required",
      html,
      attachments: [{
         filename: 'logo_miniTiket_v1.jpg',
         path: path.join(process.cwd(), 'dist/public/logo/logo_miniTiket_v1.jpg'),
         cid: 'logo' // same cid value as in the html img src of register-template.hbs
      }]
    });
  } catch (error) {
    console.error("Error sending transaction email:", error);
    throw error;
  }
}