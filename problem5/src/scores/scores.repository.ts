import type Database from "better-sqlite3";
import type { Score, CreateScoreInput, UpdateScoreInput, ScoreFilters } from "./scores.types.js";

interface ScoreRow {
  id: number;
  user_id: string;
  score: number;
  score_date: string;
  created_at: string;
  updated_at: string;
}

interface CountRow {
  count: number;
}

function rowToScore(row: ScoreRow): Score {
  return {
    id: row.id,
    userId: row.user_id,
    score: row.score,
    scoreDate: row.score_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createScore(db: Database.Database, input: CreateScoreInput): Score {
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO scores (user_id, score, score_date, created_at, updated_at)
       VALUES (@userId, @score, @scoreDate, @now, @now)`
    )
    .run({ userId: input.userId, score: input.score, scoreDate: input.scoreDate, now });

  // lastInsertRowid is bigint for very large tables; Number() is safe for all
  // practical row counts (< 2^53).
  const inserted = findScoreById(db, Number(result.lastInsertRowid));
  if (!inserted) throw new Error("Failed to retrieve score after insert");
  return inserted;
}

export function findScores(
  db: Database.Database,
  filters: ScoreFilters
): { rows: Score[]; total: number } {
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.userId !== undefined) {
    conditions.push("user_id = @userId");
    params.userId = filters.userId;
  }
  if (filters.minScore !== undefined) {
    conditions.push("score >= @minScore");
    params.minScore = filters.minScore;
  }
  if (filters.maxScore !== undefined) {
    conditions.push("score <= @maxScore");
    params.maxScore = filters.maxScore;
  }
  if (filters.fromDate !== undefined) {
    conditions.push("score_date >= @fromDate");
    params.fromDate = filters.fromDate;
  }
  if (filters.toDate !== undefined) {
    conditions.push("score_date <= @toDate");
    params.toDate = filters.toDate;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = db
    .prepare(`SELECT COUNT(*) as count FROM scores ${where}`)
    .get(params) as CountRow;

  const rows = db
    .prepare(
      `SELECT * FROM scores ${where} ORDER BY score DESC, id DESC LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit: filters.limit, offset: filters.offset }) as ScoreRow[];

  return { rows: rows.map(rowToScore), total: countRow.count };
}

export function findScoreById(db: Database.Database, id: number): Score | undefined {
  const row = db.prepare("SELECT * FROM scores WHERE id = ?").get(id) as ScoreRow | undefined;
  return row !== undefined ? rowToScore(row) : undefined;
}

export function findScoreByUserAndDate(
  db: Database.Database,
  userId: string,
  scoreDate: string
): Score | undefined {
  const row = db
    .prepare("SELECT * FROM scores WHERE user_id = ? AND score_date = ?")
    .get(userId, scoreDate) as ScoreRow | undefined;
  return row !== undefined ? rowToScore(row) : undefined;
}

export function updateScore(
  db: Database.Database,
  id: number,
  patch: UpdateScoreInput,
  current: Score
): Score {
  const now = new Date().toISOString();
  const newScore = patch.score ?? current.score;
  const newScoreDate = patch.scoreDate ?? current.scoreDate;

  db.prepare(
    `UPDATE scores SET score = @score, score_date = @scoreDate, updated_at = @now WHERE id = @id`
  ).run({ score: newScore, scoreDate: newScoreDate, now, id });

  const updated = findScoreById(db, id);
  if (!updated) throw new Error(`Score ${id} disappeared after update`);
  return updated;
}

export function deleteScore(db: Database.Database, id: number): boolean {
  const result = db.prepare("DELETE FROM scores WHERE id = ?").run(id);
  return result.changes > 0;
}
