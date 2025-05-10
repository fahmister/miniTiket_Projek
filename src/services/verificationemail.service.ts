// 1. Handlebars is template engine, 2. path to join path with the file name and 3. fs to read and manipulate files
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { Transporter } from "../utils/nodemailer";
import { FE_URL, NODEMAILER_USER} from "../config";


// Helper function for verification email
export async function sendVerificationEmail(email: string, token: string) {
    try {
        // Construct the path to the template file
        const templatePath = path.join(
            __dirname, 
            "../templates/register-template.hbs"
        );
  
        if (fs.existsSync(templatePath)) {
            const templateSource = fs.readFileSync(templatePath, "utf-8");
            const compiledTemplate = Handlebars.compile(templateSource);
            
            const html = compiledTemplate({
                email: email, 
                fe_url: `${FE_URL}/activation?token=${token}`, // Replace with your frontend URL
            });
  
            await Transporter.sendMail({
                from: `Your Event TuneInLive <${NODEMAILER_USER || 'no-reply@yourapp.com'}>`,
                to: email,
                subject: "Welcome - Verify Your Account",
                html,
                attachments: [{
                    filename: 'logo_miniTiket_v1.jpg',
                    path: path.join(__dirname, '../../public/logo/logo_miniTiket_v1.jpg'),
                    cid: 'logo' // same cid value as in the html img src of register-template.hbs
                }]
            })
        } else {
            console.error('Template file not found at:', templatePath);
        }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
    }
}