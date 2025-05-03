// 1. Handlebars is template engine, 2. path to join path with the file name and 3. fs to read and manipulate files
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { Transporter } from "../utils/nodemailer";


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
                fe_url: `http://localhost:3000/activation?token=`, // Replace with your frontend URL
            });
  
            await Transporter.sendMail({
                from: "EOHelper",
                to: email,
                subject: "Welcome - Verify Your Account",
                html
            });
        } else {
            console.error('Template file not found at:', templatePath);
        }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
    }
}