import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import * as streamifier from "streamifier";
import { CLOUDINARY_KEY, CLOUDINARY_NAME, CLOUDINARY_SECRET } from "../config";

/// configuring cloudinary with the credentials from the environment variables
cloudinary.config({
    api_key: CLOUDINARY_KEY || "",
    api_secret: CLOUDINARY_SECRET || "",
    cloud_name: CLOUDINARY_NAME || ""
})

// Function to upload a file to cloudinary
export function cloudinaryUpload(file: Express.Multer.File): Promise<UploadApiResponse> {
    // uploading file to cloudinary
    return new Promise((resolve, reject) => {
    // configuring cloudinary with uploader property and upload_stream method
    const uploadStream = cloudinary.uploader.upload_stream((err, res: UploadApiResponse ) => {
        if (err) return reject(err);

        resolve(res);
    });

    // using streamifier to create a readable stream from the file buffer and piping it (one direction) to the cloudinary upload stream
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
}

// / Function to extract the public ID from the secure URL
export function extractPublicIdFromUrl(url: string) {
    try {
        // Splitting the URL to get the public ID
        const urlParts = url.split("/");
        // Splitting without jpeg extension from the public ID
        const publicId = urlParts[urlParts.length - 1].split(".")[0];

        return publicId;
    } catch(err) {
        throw err;
    }
}
// Function to remove a file from cloudinary
export async function cloudinaryRemove(secure_url: string) {
    try {
        const publicId = extractPublicIdFromUrl(secure_url);

        return await cloudinary.uploader.destroy(publicId);
    } catch(err) {
        throw err;
    }
}