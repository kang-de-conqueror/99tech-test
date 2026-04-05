# Problem 5: A Crude Server

A RESTful CRUD API server built with **ExpressJS** and **TypeScript**, backed by **SQLite** for data persistence.

## Overview

The API manages a **Scores leaderboard** — entries that record a user's score on a given date. It exposes full CRUD functionality with list filtering and pagination.

## Stack

| Technology | Purpose |
|------------|---------|
| Express 5 | HTTP server framework |
| TypeScript 5.9 | Type-safe JavaScript |
| better-sqlite3 | SQLite database (zero external setup) |
| Zod | Input validation and parsing |
| Vitest + supertest | Integration testing |
| tsx | Dev-mode TypeScript runner |

## Project Structure

```
problem5/
├── src/
│   ├── db/
│   │   ├── client.ts          # SQLite singleton + setDb() injection for tests
│   │   └── migrations.ts      # Schema creation
│   ├── errors/
│   │   └── AppError.ts        # Typed error with HTTP status code
│   ├── middleware/
│   │   ├── validate.ts        # Zod validation middleware factory
│   │   └── errorHandler.ts    # Centralized error → HTTP response mapper
│   ├── scores/
│   │   ├── scores.types.ts    # Score interface + Zod schemas
│   │   ├── scores.repository.ts  # Raw SQL queries
│   │   ├── scores.service.ts  # Business logic
│   │   ├── scores.controller.ts  # Request/response handlers
│   │   ├── scores.routes.ts   # Express router
│   │   └── scores.test.ts     # Integration tests
│   ├── app.ts                 # createApp() factory (no listen — testable)
│   └── server.ts              # Entry point: createApp() + app.listen()
├── data/                      # Auto-created; scores.db stored here (gitignored)
├── .env.example
└── README.md
```

## Getting Started

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment**

```bash
cp .env.example .env
```

Edit `.env` if you need a different port or database path.

**3. Start the development server**

```bash
npm run dev
```

The server starts at `http://localhost:3000` and auto-restarts on file changes.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start server with hot-reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output (`dist/server.js`) |
| `npm test` | Run integration tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint source files |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | TCP port the server listens on |
| `DB_PATH` | `./data/scores.db` | Path to the SQLite database file |
| `NODE_ENV` | `development` | Runtime environment |

## API Reference

All endpoints are prefixed with `/api/scores`.

### Response format

**Success (single resource)**
```json
{ "data": { "id": 1, "userId": "alice", "score": 9500, "scoreDate": "2026-04-05", "createdAt": "...", "updatedAt": "..." } }
```

**Success (collection)**
```json
{ "data": [...], "meta": { "total": 42, "limit": 20, "offset": 0 } }
```

**Error**
```json
{ "error": { "code": "NOT_FOUND", "message": "Score with id 99 not found" } }
```

---

### POST /api/scores

Create a new score entry.

**Request body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string (1–64 chars) | Yes | Identifier of the user |
| `score` | integer ≥ 0 | Yes | Score value |
| `scoreDate` | string (`YYYY-MM-DD`) | Yes | Date the score was achieved |

**Example**

```bash
curl -X POST http://localhost:3000/api/scores \
  -H "Content-Type: application/json" \
  -d '{"userId": "alice", "score": 9500, "scoreDate": "2026-04-05"}'
```

**Response** `201 Created`
```json
{
  "data": {
    "id": 1,
    "userId": "alice",
    "score": 9500,
    "scoreDate": "2026-04-05",
    "createdAt": "2026-04-05T10:00:00.000Z",
    "updatedAt": "2026-04-05T10:00:00.000Z"
  }
}
```

| Status | Reason |
|--------|--------|
| 201 | Score created |
| 400 | Validation error |
| 409 | A score for this `userId` on this `scoreDate` already exists |

---

### GET /api/scores

List scores with optional filters and pagination.

**Query parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `userId` | string | — | Filter by exact user ID |
| `minScore` | integer | — | Minimum score (inclusive) |
| `maxScore` | integer | — | Maximum score (inclusive) |
| `fromDate` | `YYYY-MM-DD` | — | Start of date range (inclusive) |
| `toDate` | `YYYY-MM-DD` | — | End of date range (inclusive) |
| `limit` | integer 1–100 | `20` | Number of results per page |
| `offset` | integer ≥ 0 | `0` | Number of results to skip |

Results are ordered by `score DESC`.

**Example**

```bash
curl "http://localhost:3000/api/scores?userId=alice&minScore=5000&limit=10"
```

**Response** `200 OK`
```json
{
  "data": [{ "id": 1, "userId": "alice", "score": 9500, ... }],
  "meta": { "total": 1, "limit": 10, "offset": 0 }
}
```

---

### GET /api/scores/:id

Get a single score by ID.

**Example**

```bash
curl http://localhost:3000/api/scores/1
```

**Response** `200 OK`

| Status | Reason |
|--------|--------|
| 200 | Score found |
| 404 | No score with this ID |

---

### PUT /api/scores/:id

Update a score's fields. At least one field must be provided.

**Request body**

| Field | Type | Description |
|-------|------|-------------|
| `score` | integer ≥ 0 | New score value |
| `scoreDate` | `YYYY-MM-DD` | New score date |

**Example**

```bash
curl -X PUT http://localhost:3000/api/scores/1 \
  -H "Content-Type: application/json" \
  -d '{"score": 10000}'
```

| Status | Reason |
|--------|--------|
| 200 | Score updated |
| 400 | Validation error or empty body |
| 404 | No score with this ID |
| 409 | New `scoreDate` would create a duplicate for this user |

---

### DELETE /api/scores/:id

Delete a score by ID.

**Example**

```bash
curl -X DELETE http://localhost:3000/api/scores/1
```

| Status | Reason |
|--------|--------|
| 204 | Score deleted |
| 404 | No score with this ID |

---

## Design Decisions

### SQLite over PostgreSQL
SQLite requires zero external setup — no running database server, no connection strings, no Docker needed. The database file is created automatically on first run. This keeps the "getting started" experience as simple as `npm install && npm run dev`.

### Raw SQL over an ORM
Using `better-sqlite3` directly keeps the dependency surface minimal and makes every query explicit and auditable. The synchronous API of `better-sqlite3` fits naturally into Express's middleware model without added async complexity.

### Feature-slice layout
All score-related files (types, repository, service, controller, routes, tests) live together in `src/scores/`. Adding a second resource means adding a new `src/<resource>/` folder without modifying any shared code except `app.ts`.

### `createApp()` separated from `server.ts`
`createApp()` in `app.ts` does not call `app.listen()`. This lets tests import the app and pass it directly to `supertest` without binding a TCP port — enabling parallel test runs with no port conflicts.

### In-memory database for tests
Tests inject a fresh `:memory:` SQLite database via `setDb(db)` before each test suite. This gives full integration coverage (HTTP layer + SQL layer) with zero disk I/O and no cleanup needed between runs.
