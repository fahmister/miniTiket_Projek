// transaction.router.ts
import express from 'express';
import { createTransaction } from '../controllers/transaction.controller';
import { VerifyToken } from '../middlewares/auth.middleware';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post(
  '/:eventId',
  VerifyToken,
  upload.single('paymentProof'), // Middleware upload file
  createTransaction
);

// ... rute lainnya

export default router;