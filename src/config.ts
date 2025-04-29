import "dotenv/config";

export const {
    PORT, 
    SECRET_KEY, 
    CLOUDINARY_NAME, 
    CLOUDINARY_KEY, 
    CLOUDINARY_SECRET, 
    NODEMAILER_USER, 
    NODEMAILER_PASS 
} = process.env;