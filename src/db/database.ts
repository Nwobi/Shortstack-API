import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let db: DatabaseSync | null = null;

function ensureDir(p: string) {
  if (p === ":memory:") return;
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function runMigrations(database: DatabaseSync) {
  const dir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const f of files)
    database.exec(fs.readFileSync(path.join(dir, f), "utf-8"));
  logger.info(`Applied ${files.length} migration(s)`);
}

export function getDb(): DatabaseSync {
  if (!db) {
    ensureDir(env.DB_PATH);
    db = new DatabaseSync(env.DB_PATH);
    db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    runMigrations(db);
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
