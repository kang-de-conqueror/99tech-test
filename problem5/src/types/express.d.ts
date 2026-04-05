import type { ListScoresQuery } from "../scores/scores.types.js";

declare global {
  namespace Express {
    interface Locals {
      parsedQuery?: ListScoresQuery;
    }
  }
}
