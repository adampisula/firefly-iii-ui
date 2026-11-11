import type { createApiClient } from "../../lib/api/client.ts";
export type ApiClient = ReturnType<typeof createApiClient>;
export interface WebhookRecord {
  id: string;
  title: string;
  active: boolean;
  url: string;
  secret: string;
  triggers: string[];
  responses: string[];
  deliveries: string[];
}
export interface WebhookMessage {
  id: string;
  sent: boolean;
  created: string | null;
  updated: string | null;
}
export interface WebhookAttempt {
  id: string;
  statusCode: number | null;
  created: string | null;
  response: string | null;
}
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function nullableText(value: unknown): string | null {
  const v = text(value);
  return v || null;
}
function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
export function mapWebhooks(payload: unknown): WebhookRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const r = asRecord(value);
    const a = asRecord(r.attributes);
    const id = text(r.id);
    const title = text(a.title);
    return id && title
      ? [
          {
            id,
            title,
            active: a.active !== false,
            url: text(a.url),
            secret: text(a.secret),
            triggers: strings(a.triggers),
            responses: strings(a.responses),
            deliveries: strings(a.deliveries),
          },
        ]
      : [];
  });
}
export function mapWebhook(payload: unknown): WebhookRecord | null {
  return mapWebhooks({ data: [asRecord(payload).data] })[0] ?? null;
}
export function mapMessages(payload: unknown): WebhookMessage[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const r = asRecord(value);
    const a = asRecord(r.attributes);
    const id = text(r.id);
    return id
      ? [
          {
            id,
            sent: a.sent === true,
            created: nullableText(a.created_at),
            updated: nullableText(a.updated_at),
          },
        ]
      : [];
  });
}
export function mapAttempts(payload: unknown): WebhookAttempt[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const r = asRecord(value);
    const a = asRecord(r.attributes);
    const id = text(r.id);
    return id
      ? [
          {
            id,
            statusCode: num(a.status_code),
            created: nullableText(a.created_at),
            response: nullableText(a.response),
          },
        ]
      : [];
  });
}
export async function listWebhooks(
  client: ApiClient,
): Promise<WebhookRecord[]> {
  const r = await client.request("webhooks.index", { query: { limit: 100 } });
  return mapWebhooks(r.data);
}
export async function getWebhook(
  client: ApiClient,
  id: string,
): Promise<WebhookRecord | null> {
  const r = await client.request("webhooks.show", {
    pathParameters: { webhook: id },
  });
  return mapWebhook(r.data);
}
export async function listMessages(
  client: ApiClient,
  id: string,
): Promise<WebhookMessage[]> {
  const r = await client.request("webhooks.messages.index", {
    pathParameters: { webhook: id },
    query: { limit: 50 },
  });
  return mapMessages(r.data);
}
export async function listAttempts(
  client: ApiClient,
  id: string,
  messageId: string,
): Promise<WebhookAttempt[]> {
  const r = await client.request("webhooks.attempts.index", {
    pathParameters: { webhook: id, webhookMessage: messageId },
    query: { limit: 50 },
  });
  return mapAttempts(r.data);
}
