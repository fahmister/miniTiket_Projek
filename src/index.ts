import express, { Application, Request, Response, NextFunction } from "express";
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { PORT, FE_URL} from "./config";
import AuthRouter from "./routers/auth.router";
// import path from "path"; //for serving static files if needed
import EventRouter from './routers/event.router';
import VoucherRouter from './routers/voucher.router';
import { requestLogger } from "./middlewares/requestlogger.middleware";
import cors from "cors"
import helmet from "helmet"
// import transactionRouter from './routers/transaction.router';


const port = PORT || 8000;
const app: Application = express();

app.use(cookieParser())
// Add these middleware before your routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(helmet());
app.use(cors({
  origin: FE_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH' ],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(requestLogger); // Log all requests

app.get(
    "/api",
    (req: Request, res: Response, next: NextFunction) => {
      console.log("entry point for API");
      next()
    },
    (req: Request, res: Response, next: NextFunction) => {
      res.status(200).send("This is API");
    }
  );

// app.use('/api/transactions', transactionRouter);
app.use("/api/events", EventRouter);
app.use("/auth", AuthRouter);
// app.use("/avt", express.static(path.join(__dirname, "./public/avatar")));
app.use("/api", VoucherRouter); // Gunakan base path yang konsisten


app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

export default app;