import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // Unexpected error — log structured details without leaking internals to the client
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })
  );

  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
};
