import { Transporter } from "../utils/nodemailer"; 
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { Prisma } from "@prisma/client";

// This helper function of sendReferralRewardEmail inside RegisterService function 
export async function sendReferralRewardEmail(
  tx: Prisma.TransactionClient,
  referringUserId: number,
  newUserEmail: string
    ) {
        try {
          const referringUser = await tx.users.findUnique({
            where: { id: referringUserId },
            select: { email: true, first_name: true }
          });

          if (!referringUser) {
            console.error('Referring user not found');
            return;
          }

          const templatePath = path.join(
            __dirname,
            "../templates/referral-reward-notification.hbs"
          );

          if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at: ${templatePath}`);
          }      
          
          const templateSource = fs.readFileSync(templatePath, "utf-8");
          const compiledTemplate = Handlebars.compile(templateSource);
          const html = compiledTemplate({
            name: referringUser.first_name,
            points: 10000,
            referredEmail: newUserEmail
          });

          // Send email to the referring user about their reward
          await Transporter.sendMail({
            from: process.env.EMAIL_FROM || "EOHelper Rewards",
            to: referringUser.email,
            subject: "You've earned referral points!",
            html
          });
        } catch (error) {
          console.error('Error sending referral notification:', error);
          throw error;
        }
      }