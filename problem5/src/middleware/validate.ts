import type { ZodSchema } from "zod";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";

export function validate(schema: ZodSchema, target: "body" | "query" = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(new AppError(400, "VALIDATION_ERROR", "Invalid input", result.error.errors));
      return;
    }
    if (target === "body") {
      req.body = result.data;
    } else {
      // Express 5 re-parses req.query on each access, so store parsed data in res.locals
      res.locals.parsedQuery = result.data;
    }
    next();
  };
}
