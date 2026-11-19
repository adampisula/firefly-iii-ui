import { chmodSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getDataRoot } from "../user-data/owner-key.ts";

let database: DatabaseSync | null = null;

export function assistantDatabasePath(): string {
  return path.join(getDataRoot(), "assistant.sqlite");
}

function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assistant_user_settings (
      owner_key TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      base_url TEXT NOT NULL,
      model TEXT NOT NULL,
      api_key_ciphertext BLOB NOT NULL,
      api_key_iv BLOB NOT NULL,
      api_key_tag BLOB NOT NULL,
      api_key_hint TEXT NOT NULL,
      reasoning_effort TEXT NOT NULL,
      temperature REAL NOT NULL,
      max_output_tokens INTEGER NOT NULL,
      write_tools_enabled INTEGER NOT NULL DEFAULT 0,
      risky_writes_enabled INTEGER NOT NULL DEFAULT 0,
      history_retention_days INTEGER NOT NULL DEFAULT 30,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assistant_conversations (
      id TEXT PRIMARY KEY,
      owner_key TEXT NOT NULL,
      title TEXT NOT NULL,
      model TEXT NOT NULL,
      reasoning_effort TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assistant_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
      owner_key TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_events_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS assistant_conversations_owner_updated
      ON assistant_conversations(owner_key, updated_at DESC);
    CREATE INDEX IF NOT EXISTS assistant_messages_conversation_created
      ON assistant_messages(conversation_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS assistant_messages_owner
      ON assistant_messages(owner_key);

    INSERT OR IGNORE INTO schema_migrations(version, applied_at)
      VALUES (1, datetime('now'));
  `);
}

export function getAssistantDb(): DatabaseSync {
  if (database) return database;
  const file = assistantDatabasePath();
  const directory = path.dirname(file);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(file, {
    timeout: 5_000,
    enableForeignKeyConstraints: true,
  });
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA busy_timeout = 5000");
  migrate(db);
  try {
    chmodSync(file, 0o600);
  } catch {
    // Permissions are best-effort on non-POSIX filesystems.
  }
  database = db;
  return db;
}

export function resetAssistantDbForTests(): void {
  if (!database) return;
  database.close();
  database = null;
}

export function assistantDbExists(): boolean {
  return existsSync(assistantDatabasePath());
}
