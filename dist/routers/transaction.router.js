"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// transaction.router.ts
const express_1 = __importDefault(require("express"));
const transaction_controller_1 = require("../controllers/transaction.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ dest: 'uploads/' });
const router = express_1.default.Router();
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
router.post('/:eventId', auth_middleware_1.VerifyToken, upload.single('paymentProof'), // Middleware upload file
asyncHandler(transaction_controller_1.createTransaction));
// Line Victor Adi Winata
// This the router created for EO to view, accept, and reject transactions at the EO dashboard
router.get("/organizer", auth_middleware_1.VerifyToken, auth_middleware_1.EOGuard, transaction_controller_1.getTransactionsController);
router.patch("/:id/status", auth_middleware_1.VerifyToken, auth_middleware_1.EOGuard, transaction_controller_1.updateTransactionStatusController);
exports.default = router;
