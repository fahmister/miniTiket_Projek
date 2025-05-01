import { Router } from "express";
import { createVoucher } from "../controllers/voucher.controllers";
import { VerifyToken, EOGuard } from "../middlewares/auth.middleware";
import ReqValidator from "../middlewares/validator.middleware";
import { voucherSchema } from "../schemas/voucher.schema"; // Anda perlu membuat schema ini

const router = Router();

router.post(
  "/events/:eventId/vouchers",
  VerifyToken,
  EOGuard,
  ReqValidator(voucherSchema),
  createVoucher
);

export default router;