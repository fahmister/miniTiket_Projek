// import express from 'express';
// import { createTransaction, dokuWebhook, devPaymentSimulator } from '../controllers/transaction.controller';


// const router = express.Router();

// router.post('/', async (req, res, next) => {
//   try {
//     await createTransaction(req, res);
//   } catch (err) {
//     next(err);
//   }
// });
// router.post('/webhook', async (req, res, next) => {
//   try {
//     await dokuWebhook(req, res);
//   } catch (err) {
//     next(err);
//   }
// });
// router.get('/dev-payment/:trx_id', devPaymentSimulator);

// export default router;
