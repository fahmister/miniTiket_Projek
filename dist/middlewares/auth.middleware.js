"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyToken = VerifyToken;
exports.EOGuard = EOGuard;
const jsonwebtoken_1 = require("jsonwebtoken");
const config_1 = require("../config");
function VerifyToken(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            // Get the token from the request header
            // The token is expected to be in the format "Bearer <token>"
            // Split the token to get the actual token string
            const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.access_token) ||
                ((_b = req.header("Authorization")) === null || _b === void 0 ? void 0 : _b.replace("Bearer ", ""));
            if (!token) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            // Verify the token using the secret key
            // The verify function checks the token against the secret key
            // const verifyUser = verify(token, String(SECRET_KEY)) as IUserReqParam;
            // if (!verifyUser) throw new Error("Invalid Token");
            // req.user = verifyUser as IUserReqParam;
            const decoded = (0, jsonwebtoken_1.verify)(token, String(config_1.SECRET_KEY));
            if (!decoded.id || !decoded.first_name || !decoded.last_name || !decoded.roleName) {
                res.status(401).json({ error: "Invalid Token" });
                return;
            }
            req.user = decoded;
            next();
        }
        catch (err) {
            console.error('Authentication error:', err);
            res.status(401).json({ error: "Invalid Token" });
            return;
        }
    });
}
function EOGuard(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            // Add trim() and case normalization
            if (((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.roleName) === null || _b === void 0 ? void 0 : _b.trim().toLowerCase()) !== "event organizer") {
                throw new Error("Restricted");
            }
            next();
        }
        catch (err) {
            next(err);
        }
    });
}
