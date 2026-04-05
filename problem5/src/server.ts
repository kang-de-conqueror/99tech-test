import { createApp } from "./app.js";
import { getDb, closeDb } from "./db/client.js";
import { runMigrations } from "./db/migrations.js";

const rawPort = process.env.PORT ?? "3000";
const PORT = parseInt(rawPort, 10);
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`Invalid PORT value: "${rawPort}". Must be a number between 1 and 65535.`);
  process.exit(1);
}

try {
  runMigrations(getDb());
} catch (err) {
  console.error("Failed to run database migrations:", err);
  process.exit(1);
}

const app = createApp();
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    closeDb();
    console.log("Server closed.");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
