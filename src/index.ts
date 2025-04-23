import express, { Application, Request, Response, NextFunction } from "express";
import { PORT } from "./config";
import AuthRouter from "./routers/auth.router";

const port = PORT || 8080;
const app: Application = express();

app.use(express.json());
app.get(
    "/api",
    (req: Request, res: Response, next: NextFunction) => {
      console.log("test masuk");
      next()
    },
    (req: Request, res: Response, next: NextFunction) => {
      res.status(200).send("ini api");
    }
  );

  
app.use("/auth", AuthRouter)

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
