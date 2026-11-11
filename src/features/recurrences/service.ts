import type { createApiClient } from "../../lib/api/client.ts";
import {
  mapTransactionList,
  type TransactionList,
} from "../transactions/service.ts";

export type ApiClient = ReturnType<typeof createApiClient>;
export interface RepetitionRecord {
  type: string;
  moment: string;
  skip: number;
  weekend: number;
}
export interface RecurrenceTransaction {
  description: string;
  amount: string;
  sourceId: string;
  destinationId: string;
  currencyCode: string;
}
export interface RecurrenceRecord {
  id: string;
  type: string;
  title: string;
  description: string | null;
  firstDate: string;
  latestDate: string | null;
  repeatUntil: string | null;
  nrOfRepetitions: number | null;
  applyRules: boolean;
  active: boolean;
  notes: string | null;
  repetitions: RepetitionRecord[];
  transactions: RecurrenceTransaction[];
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
function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function bool(value: unknown, fallback = true): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function mapRecurrences(payload: unknown): RecurrenceRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const r = asRecord(value);
    const a = asRecord(r.attributes);
    const id = text(r.id);
    const title = text(a.title);
    if (!id || !title) return [];
    const reps = Array.isArray(a.repetitions) ? a.repetitions : [];
    const txs = Array.isArray(a.transactions) ? a.transactions : [];
    return [
      {
        id,
        type: text(a.type),
        title,
        description: nullableText(a.description),
        firstDate: text(a.first_date),
        latestDate: nullableText(a.latest_date),
        repeatUntil: nullableText(a.repeat_until),
        nrOfRepetitions:
          typeof a.nr_of_repetitions === "number" ? a.nr_of_repetitions : null,
        applyRules: bool(a.apply_rules),
        active: bool(a.active),
        notes: nullableText(a.notes),
        repetitions: reps.map((item) => {
          const rep = asRecord(item);
          return {
            type: text(rep.type),
            moment: text(rep.moment),
            skip: num(rep.skip),
            weekend: num(rep.weekend),
          };
        }),
        transactions: txs.map((item) => {
          const tx = asRecord(item);
          return {
            description: text(tx.description),
            amount: text(tx.amount),
            sourceId: text(tx.source_id),
            destinationId: text(tx.destination_id),
            currencyCode: text(tx.currency_code),
          };
        }),
      },
    ];
  });
}
export function mapRecurrence(payload: unknown): RecurrenceRecord | null {
  return mapRecurrences({ data: [asRecord(payload).data] })[0] ?? null;
}
export async function listRecurrences(
  client: ApiClient,
): Promise<RecurrenceRecord[]> {
  const r = await client.request("recurrences.index", {
    query: { limit: 100 },
  });
  return mapRecurrences(r.data);
}
export async function getRecurrence(
  client: ApiClient,
  id: string,
): Promise<RecurrenceRecord | null> {
  const r = await client.request("recurrences.show", {
    pathParameters: { recurrence: id },
  });
  return mapRecurrence(r.data);
}
export async function recurrenceTransactions(
  client: ApiClient,
  id: string,
): Promise<TransactionList> {
  const r = await client.request("recurrences.transactions", {
    pathParameters: { recurrence: id },
    query: { limit: 25 },
  });
  return mapTransactionList(r.data);
}

export interface RecurrenceDraft {
  type: string;
  title: string;
  description: string;
  firstDate: string;
  repeatUntil: string;
  nrOfRepetitions: string;
  applyRules: boolean;
  active: boolean;
  notes: string;
  repType: string;
  repMoment: string;
  repSkip: string;
  descriptionTx: string;
  amount: string;
  sourceId: string;
  destinationId: string;
  currencyCode: string;
}
export function validateRecurrenceDraft(draft: RecurrenceDraft): {
  ok: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  if (!["withdrawal", "deposit", "transfer"].includes(draft.type))
    errors.type = "Choose a supported transaction type.";
  if (!draft.title.trim()) errors.title = "Enter a title.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.firstDate))
    errors.firstDate = "Enter a valid first date.";
  if (draft.repeatUntil && !/^\d{4}-\d{2}-\d{2}$/.test(draft.repeatUntil))
    errors.repeatUntil = "Enter a valid repeat-until date.";
  if (
    draft.nrOfRepetitions &&
    (!/^\d+$/.test(draft.nrOfRepetitions) || Number(draft.nrOfRepetitions) < 1)
  )
    errors.nrOfRepetitions = "Enter 1–255 repetitions.";
  if (!["daily", "weekly", "ndom", "monthly", "yearly"].includes(draft.repType))
    errors.repType = "Choose a repetition type.";
  if (!draft.descriptionTx.trim())
    errors.descriptionTx = "Enter a transaction description.";
  if (!/^\d+(?:\.\d+)?$/.test(draft.amount) || Number(draft.amount) <= 0)
    errors.amount = "Enter a positive amount.";
  if (!/^\d+$/.test(draft.sourceId) || !/^\d+$/.test(draft.destinationId))
    errors.sourceId = "Choose both accounts.";
  if (!draft.currencyCode) errors.currencyCode = "Choose a currency.";
  return { ok: Object.keys(errors).length === 0, errors };
}
export function recurrencePayload(
  draft: RecurrenceDraft,
): Record<string, unknown> {
  return {
    type: draft.type,
    title: draft.title.trim(),
    ...(draft.description ? { description: draft.description } : {}),
    first_date: draft.firstDate,
    ...(draft.repeatUntil ? { repeat_until: draft.repeatUntil } : {}),
    ...(draft.nrOfRepetitions
      ? { nr_of_repetitions: Number(draft.nrOfRepetitions) }
      : {}),
    apply_rules: draft.applyRules,
    active: draft.active,
    ...(draft.notes ? { notes: draft.notes } : {}),
    repetitions: [
      {
        type: draft.repType,
        moment: draft.repMoment || "",
        skip: draft.repSkip ? Number(draft.repSkip) : 0,
        weekend: 0,
      },
    ],
    transactions: [
      {
        description: draft.descriptionTx.trim(),
        amount: draft.amount,
        source_id: draft.sourceId,
        destination_id: draft.destinationId,
        currency_code: draft.currencyCode,
      },
    ],
  };
}
