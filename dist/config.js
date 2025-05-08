"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FE_URL = exports.NODEMAILER_PASS = exports.NODEMAILER_USER = exports.CLOUDINARY_SECRET = exports.CLOUDINARY_KEY = exports.CLOUDINARY_NAME = exports.SECRET_KEY = exports.PORT = void 0;
require("dotenv/config");
_a = process.env, exports.PORT = _a.PORT, exports.SECRET_KEY = _a.SECRET_KEY, exports.CLOUDINARY_NAME = _a.CLOUDINARY_NAME, exports.CLOUDINARY_KEY = _a.CLOUDINARY_KEY, exports.CLOUDINARY_SECRET = _a.CLOUDINARY_SECRET, exports.NODEMAILER_USER = _a.NODEMAILER_USER, exports.NODEMAILER_PASS = _a.NODEMAILER_PASS, exports.FE_URL = _a.FE_URL;
