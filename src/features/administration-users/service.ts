import type { createApiClient } from "../../lib/api/client.ts";
export type ApiClient = ReturnType<typeof createApiClient>;
export interface UserRecord {
  id: string;
  email: string;
  role: string;
  blocked: boolean;
}
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
export function mapUsers(payload: unknown): UserRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const r = asRecord(value);
    const a = asRecord(r.attributes);
    const id = text(r.id);
    const email = text(a.email);
    return id && email
      ? [{ id, email, role: text(a.role), blocked: a.blocked === true }]
      : [];
  });
}
export function mapConfig(payload: unknown): { key: string; value: string }[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const r = asRecord(value);
    const a = asRecord(r.attributes);
    const key = text(a.title) || text(a.key) || text(r.id);
    return key ? [{ key, value: JSON.stringify(a.value ?? "") }] : [];
  });
}
export async function listUsers(client: ApiClient): Promise<UserRecord[]> {
  const r = await client.request("users.index", { query: { limit: 100 } });
  return mapUsers(r.data);
}
export async function listConfig(
  client: ApiClient,
): Promise<{ key: string; value: string }[]> {
  const r = await client.request("configuration.index");
  return mapConfig(r.data);
}
