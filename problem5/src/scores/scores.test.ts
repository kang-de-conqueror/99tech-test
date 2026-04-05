import Database from "better-sqlite3";
import supertest from "supertest";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { createApp } from "../app.js";
import { setDb, closeDb } from "../db/client.js";
import { runMigrations } from "../db/migrations.js";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestDb() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  return db;
}

beforeEach(() => setDb(createTestDb()));
afterEach(() => closeDb());

const api = () => supertest(createApp());

/** Seed a score and return the full created body */
async function seedScore(overrides: {
  userId?: string;
  score?: number;
  scoreDate?: string;
} = {}) {
  const res = await api()
    .post("/api/scores")
    .send({
      userId: overrides.userId ?? "alice",
      score: overrides.score ?? 9500,
      scoreDate: overrides.scoreDate ?? "2026-04-01",
    });
  expect(res.status, `Seed failed: ${JSON.stringify(res.body)}`).toBe(201);
  return res.body.data as {
    id: number;
    userId: string;
    score: number;
    scoreDate: string;
    createdAt: string;
    updatedAt: string;
  };
}

// ---------------------------------------------------------------------------
// Migration / schema integrity
// ---------------------------------------------------------------------------

describe("Database schema", () => {
  it("migrations create the scores table with all expected columns", () => {
    const db = new Database(":memory:");
    runMigrations(db);

    const cols = db
      .prepare("PRAGMA table_info(scores)")
      .all() as Array<{ name: string }>;

    const names = cols.map((c) => c.name);
    expect(names).toEqual(
      expect.arrayContaining(["id", "user_id", "score", "score_date", "created_at", "updated_at"])
    );
  });

  it("migrations are idempotent (safe to call twice)", () => {
    const db = new Database(":memory:");
    runMigrations(db);
    expect(() => runMigrations(db)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const res = await api().get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

// ---------------------------------------------------------------------------
// POST /api/scores — create
// ---------------------------------------------------------------------------

describe("POST /api/scores", () => {
  it("creates a score and returns 201 with correct fields", async () => {
    const res = await api()
      .post("/api/scores")
      .send({ userId: "alice", score: 9500, scoreDate: "2026-04-01" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      userId: "alice",
      score: 9500,
      scoreDate: "2026-04-01",
    });
    expect(res.body.data.id).toBeGreaterThan(0);
    expect(res.body.data.createdAt).toBeDefined();
    expect(res.body.data.updatedAt).toBeDefined();
  });

  it("accepts score = 0 (minimum valid score)", async () => {
    const res = await api()
      .post("/api/scores")
      .send({ userId: "alice", score: 0, scoreDate: "2026-04-01" });

    expect(res.status).toBe(201);
    expect(res.body.data.score).toBe(0);
  });

  it("allows two different users to have a score on the same date", async () => {
    await seedScore({ userId: "alice", scoreDate: "2026-04-01" });
    const res = await api()
      .post("/api/scores")
      .send({ userId: "bob", score: 8000, scoreDate: "2026-04-01" });

    expect(res.status).toBe(201);
  });

  it("allows the same user to have scores on different dates", async () => {
    await seedScore({ userId: "alice", scoreDate: "2026-04-01" });
    const res = await api()
      .post("/api/scores")
      .send({ userId: "alice", score: 8000, scoreDate: "2026-04-02" });

    expect(res.status).toBe(201);
  });

  // --- Validation errors ---

  it("returns 400 when userId is missing", async () => {
    const res = await api()
      .post("/api/scores")
      .send({ score: 100, scoreDate: "2026-04-01" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when userId is an empty string", async () => {
    const res = await api()
      .post("/api/scores")
      .send({ userId: "", score: 100, scoreDate: "2026-04-01" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when userId exceeds 64 characters", async () => {
    const res = await api()
      .post("/api/scores")
      .send({ userId: "a".repeat(65), score: 100, scoreDate: "2026-04-01" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when score is negative", async () => {
    const res = await api()
      .post("/api/scores")
      .send({ userId: "alice", score: -1, scoreDate: "2026-04-01" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when score is a float", async () => {
    const res = await api()
      .post("/api/scores")
      .send({ userId: "alice", score: 9.5, scoreDate: "2026-04-01" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when score is missing", async () => {
    const res = await api()
      .post("/api/scores")
      .send({ userId: "alice", scoreDate: "2026-04-01" });

    expect(res.status).toBe(400);
  });

  it("returns 400 for scoreDate in wrong format (DD-MM-YYYY)", async () => {
    const res = await api()
      .post("/api/scores")
      .send({ userId: "alice", score: 100, scoreDate: "01-04-2026" });

    expect(res.status).toBe(400);
  });

  it("returns 400 for an impossible date (month 13)", async () => {
    const res = await api()
      .post("/api/scores")
      .send({ userId: "alice", score: 100, scoreDate: "2026-13-01" });

    expect(res.status).toBe(400);
  });

  it("returns 400 for an impossible date (Feb 30)", async () => {
    const res = await api()
      .post("/api/scores")
      .send({ userId: "alice", score: 100, scoreDate: "2026-02-30" });

    expect(res.status).toBe(400);
  });

  it("returns 400 for Feb 29 on a non-leap year", async () => {
    const res = await api()
      .post("/api/scores")
      .send({ userId: "alice", score: 100, scoreDate: "2026-02-29" });

    expect(res.status).toBe(400);
  });

  it("accepts Feb 29 on a leap year", async () => {
    const res = await api()
      .post("/api/scores")
      .send({ userId: "alice", score: 100, scoreDate: "2024-02-29" });

    expect(res.status).toBe(201);
  });

  it("returns 409 for duplicate (userId, scoreDate) combination", async () => {
    await seedScore({ userId: "alice", scoreDate: "2026-04-01" });

    const res = await api()
      .post("/api/scores")
      .send({ userId: "alice", score: 8000, scoreDate: "2026-04-01" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE_SCORE");
  });
});

// ---------------------------------------------------------------------------
// GET /api/scores — list
// ---------------------------------------------------------------------------

describe("GET /api/scores", () => {
  it("returns empty array and zero total when no scores exist", async () => {
    const res = await api().get("/api/scores");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta).toEqual({ total: 0, limit: 20, offset: 0 });
  });

  it("returns scores ordered by score descending", async () => {
    await seedScore({ userId: "low", score: 1000 });
    await seedScore({ userId: "high", score: 9000 });
    await seedScore({ userId: "mid", score: 5000, scoreDate: "2026-04-02" });

    const res = await api().get("/api/scores");

    expect(res.status).toBe(200);
    const scores = res.body.data.map((d: { score: number }) => d.score);
    expect(scores).toEqual([9000, 5000, 1000]);
  });

  it("reports correct total in meta", async () => {
    await seedScore({ userId: "a" });
    await seedScore({ userId: "b", scoreDate: "2026-04-02" });

    const res = await api().get("/api/scores?limit=1");

    expect(res.body.meta.total).toBe(2);
    expect(res.body.data).toHaveLength(1);
  });

  it("uses default limit=20 and offset=0 when not specified", async () => {
    const res = await api().get("/api/scores");

    expect(res.body.meta.limit).toBe(20);
    expect(res.body.meta.offset).toBe(0);
  });

  it("filters by userId (excludes other users)", async () => {
    await seedScore({ userId: "alice" });
    await seedScore({ userId: "bob", scoreDate: "2026-04-02" });

    const res = await api().get("/api/scores?userId=alice");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].userId).toBe("alice");
    expect(res.body.meta.total).toBe(1);
  });

  it("filters by minScore (inclusive)", async () => {
    await seedScore({ userId: "a", score: 999 });
    await seedScore({ userId: "b", score: 1000, scoreDate: "2026-04-02" });
    await seedScore({ userId: "c", score: 1001, scoreDate: "2026-04-03" });

    const res = await api().get("/api/scores?minScore=1000");

    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((d: { score: number }) => d.score >= 1000)).toBe(true);
  });

  it("filters by maxScore (inclusive)", async () => {
    await seedScore({ userId: "a", score: 999 });
    await seedScore({ userId: "b", score: 1000, scoreDate: "2026-04-02" });
    await seedScore({ userId: "c", score: 1001, scoreDate: "2026-04-03" });

    const res = await api().get("/api/scores?maxScore=1000");

    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((d: { score: number }) => d.score <= 1000)).toBe(true);
  });

  it("filters by minScore=maxScore (exact score match)", async () => {
    await seedScore({ userId: "a", score: 5000 });
    await seedScore({ userId: "b", score: 7000, scoreDate: "2026-04-02" });

    const res = await api().get("/api/scores?minScore=5000&maxScore=5000");

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].score).toBe(5000);
  });

  it("filters by fromDate and toDate (inclusive on both ends)", async () => {
    await seedScore({ userId: "before", scoreDate: "2026-03-31" });
    await seedScore({ userId: "start", scoreDate: "2026-04-01", score: 1000 });
    await seedScore({ userId: "mid", scoreDate: "2026-04-15", score: 2000 });
    await seedScore({ userId: "end", scoreDate: "2026-04-30", score: 3000 });
    await seedScore({ userId: "after", scoreDate: "2026-05-01", score: 4000 });

    const res = await api().get("/api/scores?fromDate=2026-04-01&toDate=2026-04-30");

    expect(res.body.data).toHaveLength(3);
    const userIds = res.body.data.map((d: { userId: string }) => d.userId);
    expect(userIds).not.toContain("before");
    expect(userIds).not.toContain("after");
  });

  it("filters by fromDate=toDate (single day)", async () => {
    await seedScore({ userId: "yesterday", scoreDate: "2026-03-31" });
    await seedScore({ userId: "today", scoreDate: "2026-04-01", score: 1000 });
    await seedScore({ userId: "tomorrow", scoreDate: "2026-04-02", score: 2000 });

    const res = await api().get("/api/scores?fromDate=2026-04-01&toDate=2026-04-01");

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].userId).toBe("today");
  });

  it("combines userId, score range, and date range filters", async () => {
    await seedScore({ userId: "alice", score: 500, scoreDate: "2026-04-01" });
    await seedScore({ userId: "alice", score: 5000, scoreDate: "2026-04-05" });
    await seedScore({ userId: "alice", score: 9000, scoreDate: "2026-04-10" });
    await seedScore({ userId: "bob", score: 5000, scoreDate: "2026-04-05" });

    const res = await api().get(
      "/api/scores?userId=alice&minScore=1000&maxScore=8000&fromDate=2026-04-01&toDate=2026-04-07"
    );

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].userId).toBe("alice");
    expect(res.body.data[0].score).toBe(5000);
  });

  it("paginates correctly: second page has correct items and total", async () => {
    for (let i = 1; i <= 5; i++) {
      await seedScore({ userId: `user${i}`, score: i * 1000, scoreDate: `2026-04-0${i}` });
    }

    const res = await api().get("/api/scores?limit=2&offset=2");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toEqual({ total: 5, limit: 2, offset: 2 });
  });

  it("returns empty array when offset exceeds total", async () => {
    await seedScore();

    const res = await api().get("/api/scores?offset=100");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(1);
  });

  it("accepts limit=100 (maximum allowed)", async () => {
    const res = await api().get("/api/scores?limit=100");
    expect(res.status).toBe(200);
  });

  it("returns 400 for limit=0", async () => {
    const res = await api().get("/api/scores?limit=0");
    expect(res.status).toBe(400);
  });

  it("returns 400 for limit=101 (over maximum)", async () => {
    const res = await api().get("/api/scores?limit=101");
    expect(res.status).toBe(400);
  });

  it("returns 400 for negative offset", async () => {
    const res = await api().get("/api/scores?offset=-1");
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid fromDate", async () => {
    const res = await api().get("/api/scores?fromDate=not-a-date");
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /api/scores/:id — get one
// ---------------------------------------------------------------------------

describe("GET /api/scores/:id", () => {
  it("returns the score with all fields for a known id", async () => {
    const created = await seedScore({ userId: "alice", score: 9500 });

    const res = await api().get(`/api/scores/${created.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: created.id,
      userId: "alice",
      score: 9500,
      scoreDate: "2026-04-01",
    });
    expect(res.body.data.createdAt).toBeDefined();
    expect(res.body.data.updatedAt).toBeDefined();
  });

  it("returns 404 for an id that does not exist", async () => {
    const res = await api().get("/api/scores/99999");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 for a non-numeric id", async () => {
    const res = await api().get("/api/scores/abc");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ID");
  });

  it("returns 400 for id = 0", async () => {
    const res = await api().get("/api/scores/0");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ID");
  });

  it("returns 400 for a negative id", async () => {
    const res = await api().get("/api/scores/-1");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ID");
  });

  it("returns 400 for a float id like 1.5", async () => {
    const res = await api().get("/api/scores/1.5");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ID");
  });
});

// ---------------------------------------------------------------------------
// PUT /api/scores/:id — update
// ---------------------------------------------------------------------------

describe("PUT /api/scores/:id", () => {
  it("updates score and leaves scoreDate unchanged", async () => {
    const created = await seedScore({ score: 9500, scoreDate: "2026-04-01" });

    const res = await api().put(`/api/scores/${created.id}`).send({ score: 10000 });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(10000);
    expect(res.body.data.scoreDate).toBe("2026-04-01");
  });

  it("updates scoreDate and leaves score unchanged", async () => {
    const created = await seedScore({ score: 9500, scoreDate: "2026-04-01" });

    const res = await api().put(`/api/scores/${created.id}`).send({ scoreDate: "2026-04-05" });

    expect(res.status).toBe(200);
    expect(res.body.data.scoreDate).toBe("2026-04-05");
    expect(res.body.data.score).toBe(9500);
  });

  it("updates both score and scoreDate in one request", async () => {
    const created = await seedScore({ score: 9500, scoreDate: "2026-04-01" });

    const res = await api()
      .put(`/api/scores/${created.id}`)
      .send({ score: 10000, scoreDate: "2026-04-10" });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(10000);
    expect(res.body.data.scoreDate).toBe("2026-04-10");
  });

  it("updatedAt changes after update but createdAt stays the same", async () => {
    const created = await seedScore();

    // Wait 2ms to ensure timestamp differs
    await new Promise((r) => setTimeout(r, 2));

    const res = await api().put(`/api/scores/${created.id}`).send({ score: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.createdAt).toBe(created.createdAt);
    expect(res.body.data.updatedAt).not.toBe(created.updatedAt);
  });

  it("update to same scoreDate (no change) is idempotent — no 409", async () => {
    const created = await seedScore({ scoreDate: "2026-04-01" });

    const res = await api()
      .put(`/api/scores/${created.id}`)
      .send({ scoreDate: "2026-04-01" });

    expect(res.status).toBe(200);
  });

  it("returns 400 when body is empty", async () => {
    const created = await seedScore();

    const res = await api().put(`/api/scores/${created.id}`).send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for an impossible scoreDate", async () => {
    const created = await seedScore();

    const res = await api()
      .put(`/api/scores/${created.id}`)
      .send({ scoreDate: "2026-02-30" });

    expect(res.status).toBe(400);
  });

  it("returns 400 for a non-numeric id", async () => {
    const res = await api().put("/api/scores/abc").send({ score: 1000 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ID");
  });

  it("returns 404 for an id that does not exist", async () => {
    const res = await api().put("/api/scores/99999").send({ score: 1000 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 409 when new scoreDate already exists for this user", async () => {
    await seedScore({ userId: "alice", scoreDate: "2026-04-01" });
    const second = await seedScore({ userId: "alice", score: 8000, scoreDate: "2026-04-02" });

    const res = await api()
      .put(`/api/scores/${second.id}`)
      .send({ scoreDate: "2026-04-01" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE_SCORE");
  });

  it("does NOT 409 when changing scoreDate to one owned by a different user", async () => {
    await seedScore({ userId: "bob", scoreDate: "2026-04-01" });
    const aliceScore = await seedScore({ userId: "alice", scoreDate: "2026-04-02", score: 1000 });

    // alice's scoreDate → "2026-04-01" is not a duplicate because bob owns that date, not alice
    const res = await api()
      .put(`/api/scores/${aliceScore.id}`)
      .send({ scoreDate: "2026-04-01" });

    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/scores/:id — delete
// ---------------------------------------------------------------------------

describe("DELETE /api/scores/:id", () => {
  it("returns 204 and the resource is no longer accessible", async () => {
    const created = await seedScore();

    const deleteRes = await api().delete(`/api/scores/${created.id}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await api().get(`/api/scores/${created.id}`);
    expect(getRes.status).toBe(404);
  });

  it("returns 404 for an id that does not exist", async () => {
    const res = await api().delete("/api/scores/99999");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 for a non-numeric id", async () => {
    const res = await api().delete("/api/scores/abc");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ID");
  });

  it("deleting the same id twice returns 404 on the second attempt", async () => {
    const created = await seedScore();

    await api().delete(`/api/scores/${created.id}`);
    const res = await api().delete(`/api/scores/${created.id}`);

    expect(res.status).toBe(404);
  });

  it("only deletes the targeted score, others remain", async () => {
    const a = await seedScore({ userId: "alice" });
    const b = await seedScore({ userId: "bob", scoreDate: "2026-04-02" });

    await api().delete(`/api/scores/${a.id}`);

    const res = await api().get(`/api/scores/${b.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe("bob");
  });
});
