import { Request, Response, NextFunction } from "express";
import { eventSchema } from "../schemas/event.schema";
import { ZodError } from "zod";

export function ReqValidatorEvent(schema: typeof eventSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Validation error",
          details: error.errors
        });
      } else {
        next(error);
      }
    }
  };
}