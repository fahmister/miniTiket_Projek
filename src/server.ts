import express from 'express';
import transactionRouter from './routers/transaction.router';

const app = express();
app.use(express.json());

// Routes
app.use('/transactions', transactionRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
