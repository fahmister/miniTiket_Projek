import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export default function ReqValidator(schema: z.ZodObject<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((issue: any) => ({
          message: `${issue.message}`
        }));

        res.status(500).send({
          message: "NG",
          details: message
        });

        res.end();
      } else {
        next(err);
      }
    }
  };
}
