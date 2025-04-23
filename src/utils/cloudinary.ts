// import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
// import * as streamifier from "streamifier";
// import { CLOUDINARY_KEY, CLOUDINARY_NAME, CLOUDINARY_SECRET } from "../config";

// export function cloudinaryUpload(file: Express.Multer.File): Promise<UploadApiResponse> {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       { resource_type: "auto" },
//       (error, result) => {
//         if (error) {
//           return reject(error);
//         }
//         resolve(result);
//       }
//     );

//     streamifier.createReadStream(file.buffer).pipe(stream);
//   });
// }