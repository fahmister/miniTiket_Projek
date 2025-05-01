import express, { Application, Request, Response, NextFunction } from "express";
import { PORT } from "./config";
import AuthRouter from "./routers/auth.router";
import path from "path";
import EventRouter from './routers/event.router';
import CouponRouter from './routers/coupon.router';
import VoucherRouter from './routers/voucher.router';

const port = PORT || 8080;
const app: Application = express();

app.use(express.json());

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

app.use(express.json());
app.use("/events", EventRouter);
app.use("/auth", AuthRouter);
app.use("/avt", express.static(path.join(__dirname, "./public/avatar")));
app.use("/coupon", CouponRouter)
app.use("/api", VoucherRouter); // Gunakan base path yang konsisten

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});