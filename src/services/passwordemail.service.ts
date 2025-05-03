import { Transporter } from '../utils/nodemailer';
import path from 'path';
import fs from 'fs';
import Handlebars from 'handlebars';
import { IEmailService } from '../interface/user.interface';

export class EmailService implements IEmailService {
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    try {
      const templatePath = path.join(__dirname, '../templates/password-reset.hbs');
      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile(templateSource);
      
      const resetLink = `http://localhost:3000/reset-password?token=${token}`;
      const html = template({ resetLink });

      await Transporter.sendMail({
        from: 'Your Event MiniTiket <no-reply@yourapp.com>',
        to: email,
        subject: 'Password Reset Request',
        html
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }
}