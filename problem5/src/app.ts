import express from "express";
import { scoresRouter } from "./scores/scores.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/scores", scoresRouter);

  app.use(errorHandler);

  return app;
}
