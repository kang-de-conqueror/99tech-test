import type Database from "better-sqlite3";

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT    NOT NULL,
      score       INTEGER NOT NULL CHECK(score >= 0),
      score_date  TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_scores_user_id   ON scores(user_id);
    CREATE INDEX IF NOT EXISTS idx_scores_score      ON scores(score DESC);
    CREATE INDEX IF NOT EXISTS idx_scores_score_date ON scores(score_date);
  `);
}
