"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Multer = Multer;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
function Multer(type = "memoryStorage", filePrefix, folderName) {
    // defaultDir is the default directory (public) for the file to be saved in server
    const defaultDir = path_1.default.join(__dirname, "../../public");
    // configuring multer with the storage type and file name
    const storage = type === "memoryStorage" ? multer_1.default.memoryStorage() : multer_1.default.diskStorage({
        // location for the file to be saved in server
        destination: (req, file, cb) => {
            cb(null, folderName ? path_1.default.join(defaultDir, folderName) : defaultDir);
        },
        // / file name for the file to be saved in server
        filename: (req, file, cb) => {
            const prefix = filePrefix || "file-";
            const originalNameParts = file.originalname.split(".");
            const fileExtension = originalNameParts[originalNameParts.length - 1];
            cb(null, prefix + Date.now() + originalNameParts[0] + "." + fileExtension);
        }
    });
    // configuring multer with the storage as object and limits
    return (0, multer_1.default)({
        storage,
        limits: {
            fileSize: 1024 * 1024,
        },
    });
}
