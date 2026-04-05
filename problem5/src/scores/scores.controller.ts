import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import type { CreateScoreInput, UpdateScoreInput } from "./scores.types.js";
import * as service from "./scores.service.js";

/**
 * Parse a route parameter as a positive integer.
 * Throws a 400 AppError instead of returning NaN for non-numeric or non-positive values.
 */
function parseId(param: string | string[]): number {
  const raw = Array.isArray(param) ? param[0] : param;
  const id = parseInt(raw, 10);
  if (isNaN(id) || id <= 0 || String(id) !== raw) {
    throw new AppError(400, "INVALID_ID", "ID must be a positive integer");
  }
  return id;
}

export const create: RequestHandler = (req, res, next) => {
  try {
    const score = service.createScore(req.body as CreateScoreInput);
    res.status(201).json({ data: score });
  } catch (err) {
    next(err);
  }
};

export const list: RequestHandler = (_req, res, next) => {
  try {
    // parsedQuery is guaranteed by the validate middleware on this route
    const query = res.locals.parsedQuery!;
    const { rows, total } = service.listScores(query);
    res.json({ data: rows, meta: { total, limit: query.limit, offset: query.offset } });
  } catch (err) {
    next(err);
  }
};

export const getOne: RequestHandler = (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const score = service.getScore(id);
    res.json({ data: score });
  } catch (err) {
    next(err);
  }
};

export const update: RequestHandler = (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const score = service.updateScore(id, req.body as UpdateScoreInput);
    res.json({ data: score });
  } catch (err) {
    next(err);
  }
};

export const remove: RequestHandler = (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    service.deleteScore(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
