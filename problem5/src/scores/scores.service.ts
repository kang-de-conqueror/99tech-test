import { getDb } from "../db/client.js";
import { AppError } from "../errors/AppError.js";
import type { Score, CreateScoreInput, UpdateScoreInput, ListScoresQuery } from "./scores.types.js";
import * as repo from "./scores.repository.js";

export function createScore(input: CreateScoreInput): Score {
  const db = getDb();
  // Wrap duplicate-check + insert in a transaction so they are atomic.
  return db.transaction((): Score => {
    const existing = repo.findScoreByUserAndDate(db, input.userId, input.scoreDate);
    if (existing) {
      throw new AppError(409, "DUPLICATE_SCORE", "A score for this user on this date already exists");
    }
    return repo.createScore(db, input);
  })();
}

export function listScores(query: ListScoresQuery): { rows: Score[]; total: number } {
  return repo.findScores(getDb(), query);
}

export function getScore(id: number): Score {
  const score = repo.findScoreById(getDb(), id);
  if (!score) {
    throw new AppError(404, "NOT_FOUND", `Score ${id} not found`);
  }
  return score;
}

export function updateScore(id: number, input: UpdateScoreInput): Score {
  const db = getDb();
  return db.transaction((): Score => {
    const existing = repo.findScoreById(db, id);
    if (!existing) {
      throw new AppError(404, "NOT_FOUND", `Score ${id} not found`);
    }
    if (input.scoreDate && input.scoreDate !== existing.scoreDate) {
      const duplicate = repo.findScoreByUserAndDate(db, existing.userId, input.scoreDate);
      if (duplicate) {
        throw new AppError(409, "DUPLICATE_SCORE", "A score for this user on this date already exists");
      }
    }
    return repo.updateScore(db, id, input, existing);
  })();
}

export function deleteScore(id: number): void {
  const deleted = repo.deleteScore(getDb(), id);
  if (!deleted) {
    throw new AppError(404, "NOT_FOUND", `Score ${id} not found`);
  }
}
