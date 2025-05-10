import { Transporter } from '../utils/nodemailer';
import path from 'path';
import fs from 'fs';
import Handlebars from 'handlebars';
import { IEmailService } from '../interface/user.interface';
import { FE_URL, NODEMAILER_USER} from "../config";

export class EmailService implements IEmailService {
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    try {
      const templatePath = path.join(
        __dirname, 
        '../templates/password-reset.hbs'
      );
      
      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile(templateSource);
      
      // Update this to match your frontend login page with token parameter
      const resetLink = `${FE_URL}/login?token=${token}`;
      const html = template({ resetLink });

      await Transporter.sendMail({
        from: `Your Event TuneInLive <${NODEMAILER_USER || 'no-reply@yourapp.com'}>`,
        to: email,
        subject: 'Password Reset Request',
        html,
        attachments: [{
          filename: 'logo_miniTiket_v1.jpg',
          path: path.join(__dirname, '../../public/logo/logo_miniTiket_v1.jpg'),
          cid: 'logo'
        }]
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }
}