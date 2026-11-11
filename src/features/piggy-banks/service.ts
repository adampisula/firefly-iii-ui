import type { createApiClient } from "../../lib/api/client.ts";

export type ApiClient = ReturnType<typeof createApiClient>;

export interface PiggyAccount {
  accountId: string;
  name: string;
  currentAmount: string;
  currencyCode: string;
  decimalPlaces: number;
}

export interface PiggyBankRecord {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  percentage: number | null;
  startDate: string | null;
  targetDate: string | null;
  order: number;
  notes: string | null;
  objectGroupTitle: string | null;
  accounts: readonly PiggyAccount[];
}

export interface PiggyEvent {
  id: string;
  amount: string;
  date: string | null;
  journalId: string | null;
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

export function mapPiggyBanks(payload: unknown): PiggyBankRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const id = text(resource.id);
    const attributes = asRecord(resource.attributes);
    const name = text(attributes.name);
    if (!id || !name) return [];
    const accountsRaw = Array.isArray(attributes.accounts)
      ? attributes.accounts
      : [];
    return [
      {
        id,
        name,
        targetAmount: text(attributes.target_amount),
        currentAmount: text(attributes.current_amount),
        percentage:
          typeof attributes.percentage === "number"
            ? attributes.percentage
            : null,
        startDate: nullableText(attributes.start_date),
        targetDate: nullableText(attributes.target_date),
        order: num(attributes.order),
        notes: nullableText(attributes.notes),
        objectGroupTitle: nullableText(attributes.object_group_title),
        accounts: accountsRaw.flatMap((entry) => {
          const account = asRecord(entry);
          const accountId = text(account.id) || text(account.account_id);
          if (!accountId) return [];
          return [
            {
              accountId,
              name: text(account.name),
              currentAmount: text(account.current_amount),
              currencyCode: text(account.currency_code),
              decimalPlaces: num(account.currency_decimal_places, 2),
            },
          ];
        }),
      },
    ];
  });
}

export function mapPiggyBank(payload: unknown): PiggyBankRecord | null {
  return mapPiggyBanks({ data: [asRecord(payload).data] })[0] ?? null;
}

export function mapPiggyEvents(payload: unknown): PiggyEvent[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const id = text(resource.id);
    const attributes = asRecord(resource.attributes);
    return id
      ? [
          {
            id,
            amount: text(attributes.amount),
            date: nullableText(attributes.date),
            journalId: nullableText(attributes.transaction_journal_id),
          },
        ]
      : [];
  });
}

export interface PiggyDraft {
  name: string;
  targetAmount: string;
  startDate: string;
  targetDate: string;
  order: string;
  notes: string;
  objectGroupTitle: string;
  accountId: string;
  currentAmount: string;
  currencyCode: string;
}

export function validatePiggyDraft(draft: PiggyDraft): {
  ok: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = "Enter a savings-goal name.";
  else if (draft.name.trim().length > 255)
    errors.name = "Use 255 characters or fewer.";
  if (
    !/^\d+(?:\.\d+)?$/.test(draft.targetAmount) ||
    Number(draft.targetAmount) < 0
  )
    errors.targetAmount = "Enter a non-negative target amount.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.startDate))
    errors.startDate = "Enter a valid start date.";
  if (draft.targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(draft.targetDate))
    errors.targetDate = "Enter a valid target date.";
  if (
    draft.startDate &&
    draft.targetDate &&
    draft.targetDate <= draft.startDate
  )
    errors.targetDate = "Target date must be after the start date.";
  if (!/^\d+$/.test(draft.accountId))
    errors.accountId = "Choose an asset account.";
  if (
    !/^\d+(?:\.\d+)?$/.test(draft.currentAmount) ||
    Number(draft.currentAmount) < 0
  )
    errors.currentAmount = "Enter a non-negative reserved amount.";
  if (draft.order && !/^\d+$/.test(draft.order))
    errors.order = "Order must be a whole number.";
  return { ok: Object.keys(errors).length === 0, errors };
}

export function piggyPayload(
  draft: PiggyDraft,
  existing: readonly PiggyAccount[] = [],
): Record<string, unknown> {
  const others = existing
    .filter((account) => account.accountId !== draft.accountId)
    .map((account) => ({
      account_id: account.accountId,
      current_amount: account.currentAmount,
    }));
  return {
    name: draft.name.trim(),
    target_amount: draft.targetAmount,
    transaction_currency_code: draft.currencyCode,
    start_date: draft.startDate,
    ...(draft.targetDate ? { target_date: draft.targetDate } : {}),
    ...(draft.order ? { order: Number(draft.order) } : {}),
    ...(draft.notes ? { notes: draft.notes } : {}),
    ...(draft.objectGroupTitle
      ? { object_group_title: draft.objectGroupTitle }
      : {}),
    accounts: [
      ...others,
      { account_id: draft.accountId, current_amount: draft.currentAmount },
    ],
  };
}

export async function listPiggyBanks(
  client: ApiClient,
): Promise<PiggyBankRecord[]> {
  const response = await client.request("piggy-banks.index", {
    query: { limit: 100 },
  });
  return mapPiggyBanks(response.data);
}
export async function getPiggyBank(
  client: ApiClient,
  id: string,
): Promise<PiggyBankRecord | null> {
  const response = await client.request("piggy-banks.show", {
    pathParameters: { piggyBank: id },
  });
  return mapPiggyBank(response.data);
}
export async function getPiggyEvents(
  client: ApiClient,
  id: string,
): Promise<PiggyEvent[]> {
  const response = await client.request("piggy-banks.events", {
    pathParameters: { piggyBank: id },
    query: { limit: 100 },
  });
  return mapPiggyEvents(response.data);
}
