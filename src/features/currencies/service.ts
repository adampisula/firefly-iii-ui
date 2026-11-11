import type { createApiClient } from "../../lib/api/client.ts";
export type ApiClient = ReturnType<typeof createApiClient>;
export interface CurrencyRecord {
  id: string;
  name: string;
  code: string;
  symbol: string;
  decimalPlaces: number;
  enabled: boolean;
  default: boolean;
  primary: boolean;
}
export interface ExchangeRateRecord {
  id: string;
  from: string;
  to: string;
  date: string | null;
  rate: string;
}
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function num(value: unknown, fallback = 2): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
export function mapCurrencies(payload: unknown): CurrencyRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const r = asRecord(value);
    const a = asRecord(r.attributes);
    const id = text(r.id);
    const code = text(a.code);
    const name = text(a.name);
    return id && code && name
      ? [
          {
            id,
            name,
            code,
            symbol: text(a.symbol),
            decimalPlaces: num(a.decimal_places),
            enabled: a.enabled === true,
            default: a.default === true,
            primary: a.primary === true,
          },
        ]
      : [];
  });
}
export function mapCurrency(payload: unknown): CurrencyRecord | null {
  return mapCurrencies({ data: [asRecord(payload).data] })[0] ?? null;
}
export function mapRates(payload: unknown): ExchangeRateRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const r = asRecord(value);
    const a = asRecord(r.attributes);
    const id = text(r.id);
    const rate = text(a.rate);
    return id && rate
      ? [
          {
            id,
            from: text(a.from_currency_code) || text(a.from),
            to: text(a.to_currency_code) || text(a.to),
            date: text(a.date) || null,
            rate,
          },
        ]
      : [];
  });
}
export async function listCurrencies(
  client: ApiClient,
): Promise<CurrencyRecord[]> {
  const r = await client.request("currencies.index", { query: { limit: 100 } });
  return mapCurrencies(r.data).sort((a, b) => a.code.localeCompare(b.code));
}
export async function getCurrency(
  client: ApiClient,
  code: string,
): Promise<CurrencyRecord | null> {
  const r = await client.request("currencies.show", {
    pathParameters: { currencyCode: code },
  });
  return mapCurrency(r.data);
}
export async function listRates(
  client: ApiClient,
): Promise<ExchangeRateRecord[]> {
  const r = await client.request("exchange-rates.index", {
    query: { limit: 100 },
  });
  return mapRates(r.data);
}
export interface CurrencyDraft {
  name: string;
  code: string;
  symbol: string;
  decimalPlaces: string;
  enabled: boolean;
  default: boolean;
}
export function validateCurrencyDraft(draft: CurrencyDraft): {
  ok: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = "Enter a currency name.";
  if (!/^[A-Za-z]{3,32}$/.test(draft.code))
    errors.code = "Use a 3–32 character code.";
  if (!draft.symbol.trim()) errors.symbol = "Enter a symbol.";
  if (!/^\d+$/.test(draft.decimalPlaces) || Number(draft.decimalPlaces) > 12)
    errors.decimalPlaces = "Decimals must be 0–12.";
  return { ok: Object.keys(errors).length === 0, errors };
}
export function currencyPayload(draft: CurrencyDraft): Record<string, unknown> {
  return {
    name: draft.name.trim(),
    code: draft.code.toUpperCase(),
    symbol: draft.symbol.trim(),
    decimal_places: Number(draft.decimalPlaces),
    enabled: draft.enabled,
    default: draft.default,
  };
}
export function validateRate(
  from: string,
  to: string,
  date: string,
  rate: string,
): { ok: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!/^[A-Za-z]{3}$/.test(from) || !/^[A-Za-z]{3}$/.test(to))
    errors.pair = "Use three-letter currency codes.";
  if (from.toUpperCase() === to.toUpperCase())
    errors.to = "Choose two different currencies.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = "Enter a valid date.";
  if (!/^\d+(?:\.\d+)?$/.test(rate) || Number(rate) <= 0)
    errors.rate = "Enter a positive rate.";
  return { ok: Object.keys(errors).length === 0, errors };
}
