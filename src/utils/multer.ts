import { Request } from "express";
import multer from "multer";
import path from "path";

export function Multer(
  type: "memoryStorage" | "diskStorage" = "memoryStorage",
  filePrefix?: string,
  folderName?: string
) {
    // defaultDir is the default directory (public) for the file to be saved in server
    const defaultDir = path.join(__dirname, "../../public");
    
   // configuring multer with the storage type and file name
   const storage = type === "memoryStorage" ? multer.memoryStorage() : multer.diskStorage({
    // location for the file to be saved in server
    destination: (
        req: Request,
        file: Express.Multer.File,
        cb: (err: Error | null, destination: string) => void
    ) => {
        cb(null, folderName ? path.join(defaultDir, folderName) : defaultDir)
    },
    // / file name for the file to be saved in server
    filename: (
        req: Request,
        file: Express.Multer.File,
        cb: (err: Error | null, filename: string) => void
    ) => {
        const prefix = filePrefix || "file-";
        const originalNameParts = file.originalname.split(".");
        const fileExtension = originalNameParts[originalNameParts.length - 1];

        cb(
            null, prefix + Date.now() + originalNameParts[0] + "." + fileExtension
        )
    }
  })

  // configuring multer with the storage as object and limits
  return multer({
    storage,
    limits: {
      fileSize: 1024 * 1024,
    },
  });
}