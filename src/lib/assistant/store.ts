import { randomUUID } from "node:crypto";
import { getAssistantDb } from "./db.ts";
import {
  apiKeyHint,
  decryptApiKey,
  encryptApiKey,
  parseAssistantSettings,
  type StoredProviderSettings,
} from "./provider-config.ts";

export interface AssistantToolEvent {
  name: string;
  status: "read" | "approved" | "denied" | "error";
  operation?: string;
  summary?: string;
}

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  toolEvents: AssistantToolEvent[];
}

export interface AssistantConversationSummary {
  id: string;
  title: string;
  model: string;
  reasoningEffort: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface AssistantConversation extends AssistantConversationSummary {
  messages: AssistantMessage[];
}

interface SettingsRow {
  owner_key: string;
  provider: string;
  base_url: string;
  model: string;
  api_key_ciphertext: Uint8Array;
  api_key_iv: Uint8Array;
  api_key_tag: Uint8Array;
  api_key_hint: string;
  reasoning_effort: string;
  temperature: number;
  max_output_tokens: number;
  write_tools_enabled: number;
  risky_writes_enabled: number;
  history_retention_days: number;
  created_at: string;
  updated_at: string;
}

interface ConversationRow {
  id: string;
  title: string;
  model: string;
  reasoning_effort: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface MessageRow {
  id: string;
  role: string;
  content: string;
  created_at: string;
  tool_events_json: string | null;
}

function mapSettings(row: SettingsRow): StoredProviderSettings {
  return {
    provider: row.provider,
    baseUrl: row.base_url,
    model: row.model,
    apiKeyCiphertext: new Uint8Array(row.api_key_ciphertext),
    apiKeyIv: new Uint8Array(row.api_key_iv),
    apiKeyTag: new Uint8Array(row.api_key_tag),
    apiKeyHint: row.api_key_hint,
    reasoningEffort:
      row.reasoning_effort as StoredProviderSettings["reasoningEffort"],
    temperature: row.temperature,
    maxOutputTokens: row.max_output_tokens,
    writeToolsEnabled: row.write_tools_enabled === 1,
    riskyWritesEnabled: row.risky_writes_enabled === 1,
    historyRetentionDays: row.history_retention_days,
  };
}

function mapConversation(row: ConversationRow): AssistantConversationSummary {
  return {
    id: row.id,
    title: row.title,
    model: row.model,
    reasoningEffort: row.reasoning_effort,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messageCount: row.message_count,
  };
}

function parseToolEvents(raw: string | null): AssistantToolEvent[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is AssistantToolEvent =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as AssistantToolEvent).name === "string" &&
        typeof (item as AssistantToolEvent).status === "string",
    );
  } catch {
    return [];
  }
}

function mapMessage(row: MessageRow): AssistantMessage {
  return {
    id: row.id,
    role: row.role === "assistant" ? "assistant" : "user",
    content: row.content,
    createdAt: row.created_at,
    toolEvents: parseToolEvents(row.tool_events_json),
  };
}

export function getProviderSettings(
  ownerKey: string,
): StoredProviderSettings | null {
  const row = getAssistantDb()
    .prepare("SELECT * FROM assistant_user_settings WHERE owner_key = ?")
    .get(ownerKey) as SettingsRow | undefined;
  return row ? mapSettings(row) : null;
}

export function getProviderApiKey(
  ownerKey: string,
  settings: StoredProviderSettings,
): string | null {
  if (settings.apiKeyCiphertext.length === 0) return null;
  return decryptApiKey(
    settings.apiKeyCiphertext,
    settings.apiKeyIv,
    settings.apiKeyTag,
    ownerKey,
  );
}

export function saveProviderSettings(
  ownerKey: string,
  input: unknown,
  apiKey?: string,
): StoredProviderSettings {
  const db = getAssistantDb();
  const existing = getProviderSettings(ownerKey);
  const parsed = parseAssistantSettings(input, existing ?? undefined);
  const now = new Date().toISOString();
  const encrypted = apiKey?.trim()
    ? encryptApiKey(apiKey.trim(), ownerKey)
    : existing
      ? {
          ciphertext: existing.apiKeyCiphertext,
          iv: existing.apiKeyIv,
          tag: existing.apiKeyTag,
        }
      : null;
  const hint = apiKey?.trim()
    ? apiKeyHint(apiKey)
    : (existing?.apiKeyHint ?? "");

  db.prepare(
    `INSERT INTO assistant_user_settings (
      owner_key, provider, base_url, model, api_key_ciphertext, api_key_iv,
      api_key_tag, api_key_hint, reasoning_effort, temperature,
      max_output_tokens, write_tools_enabled, risky_writes_enabled,
      history_retention_days, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(owner_key) DO UPDATE SET
      provider = excluded.provider,
      base_url = excluded.base_url,
      model = excluded.model,
      api_key_ciphertext = excluded.api_key_ciphertext,
      api_key_iv = excluded.api_key_iv,
      api_key_tag = excluded.api_key_tag,
      api_key_hint = excluded.api_key_hint,
      reasoning_effort = excluded.reasoning_effort,
      temperature = excluded.temperature,
      max_output_tokens = excluded.max_output_tokens,
      write_tools_enabled = excluded.write_tools_enabled,
      risky_writes_enabled = excluded.risky_writes_enabled,
      history_retention_days = excluded.history_retention_days,
      updated_at = excluded.updated_at`,
  ).run(
    ownerKey,
    parsed.provider,
    parsed.baseUrl,
    parsed.model,
    encrypted?.ciphertext ?? new Uint8Array(),
    encrypted?.iv ?? new Uint8Array(),
    encrypted?.tag ?? new Uint8Array(),
    hint,
    parsed.reasoningEffort,
    parsed.temperature,
    parsed.maxOutputTokens,
    parsed.writeToolsEnabled ? 1 : 0,
    parsed.riskyWritesEnabled ? 1 : 0,
    parsed.historyRetentionDays,
    now,
    now,
  );
  return getProviderSettings(ownerKey)!;
}

export function deleteProviderSettings(ownerKey: string): void {
  getAssistantDb()
    .prepare("DELETE FROM assistant_user_settings WHERE owner_key = ?")
    .run(ownerKey);
}

export function listConversations(
  ownerKey: string,
  retentionDays: number,
): AssistantConversationSummary[] {
  const db = getAssistantDb();
  db.prepare(
    "DELETE FROM assistant_conversations WHERE owner_key = ? AND datetime(updated_at) < datetime('now', ?)",
  ).run(ownerKey, `-${Math.max(1, retentionDays)} days`);
  const rows = db
    .prepare(
      `SELECT c.id, c.title, c.model, c.reasoning_effort, c.created_at,
              c.updated_at,
              (SELECT COUNT(*) FROM assistant_messages m
               WHERE m.conversation_id = c.id AND m.owner_key = c.owner_key) AS message_count
       FROM assistant_conversations c
       WHERE c.owner_key = ?
       ORDER BY c.updated_at DESC
       LIMIT 100`,
    )
    .all(ownerKey) as unknown as ConversationRow[];
  return rows.map(mapConversation);
}

export function createConversation(
  ownerKey: string,
  model: string,
  reasoningEffort: string,
  title = "New conversation",
): AssistantConversationSummary {
  const db = getAssistantDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO assistant_conversations
      (id, owner_key, title, model, reasoning_effort, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, ownerKey, title.slice(0, 120), model, reasoningEffort, now, now);
  return {
    id,
    title: title.slice(0, 120),
    model,
    reasoningEffort,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
  };
}

export function getConversation(
  ownerKey: string,
  id: string,
): AssistantConversation | null {
  const db = getAssistantDb();
  const row = db
    .prepare(
      `SELECT c.id, c.title, c.model, c.reasoning_effort, c.created_at,
              c.updated_at,
              (SELECT COUNT(*) FROM assistant_messages m
               WHERE m.conversation_id = c.id AND m.owner_key = c.owner_key) AS message_count
       FROM assistant_conversations c
       WHERE c.id = ? AND c.owner_key = ?`,
    )
    .get(id, ownerKey) as ConversationRow | undefined;
  if (!row) return null;
  const messages = db
    .prepare(
      `SELECT id, role, content, created_at, tool_events_json
       FROM assistant_messages
       WHERE conversation_id = ? AND owner_key = ?
       ORDER BY created_at ASC`,
    )
    .all(id, ownerKey) as unknown as MessageRow[];
  return { ...mapConversation(row), messages: messages.map(mapMessage) };
}

export function appendMessage(
  ownerKey: string,
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  toolEvents: AssistantToolEvent[] = [],
): AssistantMessage {
  const db = getAssistantDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO assistant_messages
      (id, conversation_id, owner_key, role, content, tool_events_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    conversationId,
    ownerKey,
    role,
    content.slice(0, 100_000),
    toolEvents.length ? JSON.stringify(toolEvents) : null,
    now,
  );
  db.prepare(
    "UPDATE assistant_conversations SET updated_at = ? WHERE id = ? AND owner_key = ?",
  ).run(now, conversationId, ownerKey);
  db.prepare(
    `DELETE FROM assistant_messages
     WHERE conversation_id = ? AND owner_key = ? AND id NOT IN (
       SELECT id FROM assistant_messages
       WHERE conversation_id = ? AND owner_key = ?
       ORDER BY created_at DESC LIMIT 200
     )`,
  ).run(conversationId, ownerKey, conversationId, ownerKey);
  return { id, role, content, createdAt: now, toolEvents };
}

export function updateConversationTitle(
  ownerKey: string,
  id: string,
  title: string,
): void {
  getAssistantDb()
    .prepare(
      "UPDATE assistant_conversations SET title = ?, updated_at = ? WHERE id = ? AND owner_key = ?",
    )
    .run(title.slice(0, 120), new Date().toISOString(), id, ownerKey);
}

export function deleteConversation(ownerKey: string, id: string): boolean {
  const result = getAssistantDb()
    .prepare(
      "DELETE FROM assistant_conversations WHERE id = ? AND owner_key = ?",
    )
    .run(id, ownerKey);
  return result.changes > 0;
}

export function deleteAllConversations(ownerKey: string): void {
  getAssistantDb()
    .prepare("DELETE FROM assistant_conversations WHERE owner_key = ?")
    .run(ownerKey);
}

export function messageHistoryForModel(
  ownerKey: string,
  conversationId: string,
  limit: number,
): { role: "user" | "assistant"; content: string }[] {
  const rows = getAssistantDb()
    .prepare(
      `SELECT role, content FROM assistant_messages
       WHERE conversation_id = ? AND owner_key = ? AND role IN ('user', 'assistant')
       ORDER BY created_at DESC LIMIT ?`,
    )
    .all(conversationId, ownerKey, limit) as unknown as {
    role: string;
    content: string;
  }[];
  return rows.reverse().map((row) => ({
    role: row.role === "assistant" ? "assistant" : "user",
    content: row.content,
  }));
}
