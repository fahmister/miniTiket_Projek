import express, { Application, Request, Response, NextFunction } from "express";
import { PORT } from "./config";
import AuthRouter from "./routers/auth.router";
import path from "path";
import EventRouter from './routers/event.router'; // Pastikan path benar

const port = PORT || 8080;
const app: Application = express();

// app.use.express.json() is a built-in middleware function in Express. 
// It parses incoming requests with JSON payloads and is based on body-parser.
app.use(express.json());

// lines 15 to 20 is a middleware function that logs the request method and URL to the console
// named as middleware for logging requests because handler position located at center of the middleware stack
app.get(
    "/api",
    (req: Request, res: Response, next: NextFunction) => {
      console.log("entry point for API");
      next() // next () important to call next() to pass the request to the next middleware or route handler
    },
    (req: Request, res: Response, next: NextFunction) => {
      res.status(200).send("This is API");
    }
  );

// Pasang router setelah express.json()
app.use(express.json());
app.use('/events', EventRouter);
// This router handles all authentication-related routes /auth/register, /auth/login
app.use("/auth", AuthRouter);
// router for static files (avatar) in public folder
app.use("/avt", express.static(path.join(__dirname, "./public/avatar")));

// listening to the port specified in the environment variable or default to 8080
// This will start the server and listen for incoming requests on the specified port
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});