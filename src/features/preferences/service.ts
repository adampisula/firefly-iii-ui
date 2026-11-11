import type { createApiClient } from "../../lib/api/client.ts";
export type ApiClient = ReturnType<typeof createApiClient>;
export interface PreferenceRecord {
  name: string;
  data: unknown;
}
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}
export function mapPreferences(payload: unknown): PreferenceRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const r = asRecord(value);
    const a = asRecord(r.attributes);
    const name = typeof a.name === "string" ? a.name : "";
    return name ? [{ name, data: a.data }] : [];
  });
}
export async function listPreferences(
  client: ApiClient,
): Promise<PreferenceRecord[]> {
  const r = await client.request("preferences.index", {
    query: { limit: 200 },
  });
  return mapPreferences(r.data);
}
export const PREFERENCE_KEYS = [
  "locale",
  "listPageSize",
  "viewRange",
  "frontpageAccounts",
  "customFiscalYear",
  "fiscalYearStart",
  "convert_to_primary",
  "transaction_journal_optional_fields",
] as const;
export function preferenceValue(
  preferences: readonly PreferenceRecord[],
  name: string,
): unknown {
  return preferences.find((item) => item.name === name)?.data;
}
