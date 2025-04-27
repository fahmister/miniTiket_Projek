import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

// Middleware to validate request body against Zod schema
export default function ReqValidator(schema: z.ZodObject<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      // Handle ZodError specifically
      if (err instanceof ZodError) {
        // Extract error messages from ZodError
        // Map ZodError messages to a more user-friendly format
        const message = err.errors.map((issue: any) => ({
          message: `${issue.message}`
        }));

        res.status(500).send({
          message: "NG",
          details: message
        });

        res.end();
      } else {
        // Handle other errors
        next(err);
      }
    }
  };
}
