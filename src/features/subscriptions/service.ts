import type { createApiClient } from "../../lib/api/client.ts";
import {
  mapTransactionList,
  type TransactionList,
} from "../transactions/service.ts";

export type ApiClient = ReturnType<typeof createApiClient>;

export interface BillRecord {
  id: string;
  name: string;
  amountMin: string;
  amountMax: string;
  amountAvg: string;
  currencyCode: string;
  decimalPlaces: number;
  date: string;
  endDate: string | null;
  extensionDate: string | null;
  repeatFreq: string;
  skip: number;
  active: boolean;
  notes: string | null;
  objectGroupId: string | null;
  objectGroupTitle: string | null;
  payDates: readonly string[];
  nextExpectedMatch: string | null;
  nextExpectedMatchDiff: string | null;
}

export interface BillRule {
  id: string;
  title: string;
  active: boolean;
}

export interface BillRelated {
  transactions: TransactionList;
  rules: readonly BillRule[];
  attachments: readonly {
    id: string;
    title: string;
    filename: string;
    mime: string;
    size: number;
  }[];
}

export const REPEAT_FREQUENCIES = [
  "weekly",
  "monthly",
  "quarterly",
  "half-year",
  "yearly",
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nullableText(value: unknown): string | null {
  const result = text(value);
  return result ? result : null;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function mapBills(payload: unknown): BillRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const id = text(resource.id);
    const attributes = asRecord(resource.attributes);
    const name = text(attributes.name);
    if (!id || !name) return [];
    return [
      {
        id,
        name,
        amountMin: text(attributes.amount_min),
        amountMax: text(attributes.amount_max),
        amountAvg: text(attributes.amount_avg),
        currencyCode: text(attributes.currency_code),
        decimalPlaces: numberValue(attributes.currency_decimal_places, 2),
        date: text(attributes.date),
        endDate: nullableText(attributes.end_date),
        extensionDate: nullableText(attributes.extension_date),
        repeatFreq: text(attributes.repeat_freq),
        skip: numberValue(attributes.skip),
        active: attributes.active !== false,
        notes: nullableText(attributes.notes),
        objectGroupId: nullableText(attributes.object_group_id),
        objectGroupTitle: nullableText(attributes.object_group_title),
        payDates: Array.isArray(attributes.pay_dates)
          ? attributes.pay_dates.filter(
              (date): date is string => typeof date === "string",
            )
          : [],
        nextExpectedMatch: nullableText(attributes.next_expected_match),
        nextExpectedMatchDiff: nullableText(
          attributes.next_expected_match_diff,
        ),
      },
    ];
  });
}

export function mapBill(payload: unknown): BillRecord | null {
  return mapBills({ data: [asRecord(payload).data] })[0] ?? null;
}

export function mapBillRules(payload: unknown): BillRule[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const id = text(resource.id);
    const attributes = asRecord(resource.attributes);
    const title = text(attributes.title);
    return id && title
      ? [{ id, title, active: attributes.active !== false }]
      : [];
  });
}

export function mapBillAttachments(payload: unknown) {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const id = text(resource.id);
    const attributes = asRecord(resource.attributes);
    const title = text(attributes.title);
    return id && title
      ? [
          {
            id,
            title,
            filename: text(attributes.filename),
            mime: text(attributes.mime),
            size: numberValue(attributes.size),
          },
        ]
      : [];
  });
}

export interface BillDraft {
  name: string;
  amountMin: string;
  amountMax: string;
  currencyCode: string;
  date: string;
  endDate: string;
  extensionDate: string;
  repeatFreq: string;
  skip: string;
  active: boolean;
  notes: string;
  objectGroupTitle: string;
}

export function validateBillDraft(draft: BillDraft): {
  ok: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = "Enter a subscription name.";
  else if (draft.name.trim().length > 255)
    errors.name = "Use 255 characters or fewer.";
  if (!/^\d+(?:\.\d+)?$/.test(draft.amountMin) || Number(draft.amountMin) <= 0)
    errors.amountMin = "Enter a positive minimum amount.";
  if (!/^\d+(?:\.\d+)?$/.test(draft.amountMax) || Number(draft.amountMax) <= 0)
    errors.amountMax = "Enter a positive maximum amount.";
  if (
    !errors.amountMin &&
    !errors.amountMax &&
    Number(draft.amountMin) > Number(draft.amountMax)
  )
    errors.amountMax = "Maximum amount must not be below the minimum.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date))
    errors.date = "Enter a valid first date.";
  if (
    !REPEAT_FREQUENCIES.includes(
      draft.repeatFreq as (typeof REPEAT_FREQUENCIES)[number],
    )
  )
    errors.repeatFreq = "Choose a supported frequency.";
  if (draft.skip && !/^\d+$/.test(draft.skip))
    errors.skip = "Skip must be a whole number.";
  if (draft.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(draft.endDate))
    errors.endDate = "Enter a valid end date.";
  if (draft.extensionDate && !/^\d{4}-\d{2}-\d{2}$/.test(draft.extensionDate))
    errors.extensionDate = "Enter a valid extension date.";
  if (!draft.currencyCode) errors.currencyCode = "Choose a currency.";
  return { ok: Object.keys(errors).length === 0, errors };
}

export function billPayload(draft: BillDraft): Record<string, unknown> {
  return {
    name: draft.name.trim(),
    amount_min: draft.amountMin,
    amount_max: draft.amountMax,
    currency_code: draft.currencyCode,
    date: draft.date,
    repeat_freq: draft.repeatFreq,
    skip: draft.skip ? Number(draft.skip) : 0,
    active: draft.active,
    ...(draft.endDate ? { end_date: draft.endDate } : {}),
    ...(draft.extensionDate ? { extension_date: draft.extensionDate } : {}),
    ...(draft.notes ? { notes: draft.notes } : {}),
    ...(draft.objectGroupTitle
      ? { object_group_title: draft.objectGroupTitle }
      : {}),
  };
}

export async function listBills(
  client: ApiClient,
  alias = false,
): Promise<BillRecord[]> {
  const response = await client.request(
    alias ? "subscriptions.index" : "bills.index",
    { query: { limit: 100 } },
  );
  return mapBills(response.data);
}

export async function getBill(
  client: ApiClient,
  id: string,
  alias = false,
): Promise<BillRecord | null> {
  const response = await client.request(
    alias ? "subscriptions.show" : "bills.show",
    {
      pathParameters: { bill: id },
    },
  );
  return mapBill(response.data);
}

export async function getBillRelated(
  client: ApiClient,
  id: string,
  alias = false,
): Promise<BillRelated> {
  const prefix = alias ? "subscriptions" : "bills";
  const [transactions, rules, attachments] = await Promise.all([
    client.request(`${prefix}.transactions` as "bills.transactions", {
      pathParameters: { bill: id },
      query: { limit: 25 },
    }),
    client.request(`${prefix}.rules` as "bills.rules", {
      pathParameters: { bill: id },
      query: { limit: 100 },
    }),
    client.request(`${prefix}.attachments` as "bills.attachments", {
      pathParameters: { bill: id },
      query: { limit: 100 },
    }),
  ]);
  return {
    transactions: mapTransactionList(transactions.data),
    rules: mapBillRules(rules.data),
    attachments: mapBillAttachments(attachments.data),
  };
}

export function billGroupLabel(bill: BillRecord): string {
  return bill.objectGroupTitle ?? "Ungrouped";
}
