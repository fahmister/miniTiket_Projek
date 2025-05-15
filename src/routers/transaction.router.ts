// transaction.router.ts
import express from 'express';
import { createTransaction,
        getTransactionsController,
        updateTransactionStatusController
        } from '../controllers/transaction.controller';
import { VerifyToken, EOGuard } from '../middlewares/auth.middleware';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

function asyncHandler(
  fn: (req: express.Request, res: express.Response, next: express.NextFunction) => any
) {
  return function (req: express.Request, res: express.Response, next: express.NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.post(
  '/:eventId',
  VerifyToken,
  upload.single('paymentProof'), // Middleware upload file
  asyncHandler(createTransaction)
);


// Line Victor Adi Winata
// This the router created for EO to view, accept, and reject transactions at the EO dashboard
router.get("/organizer", VerifyToken, EOGuard, getTransactionsController);

router.patch("/:id/status", VerifyToken, EOGuard, updateTransactionStatusController);

export default router;