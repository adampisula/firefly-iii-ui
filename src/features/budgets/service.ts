import type { createApiClient } from "../../lib/api/client.ts";
import {
  mapTransactionList,
  type TransactionList,
} from "../transactions/service.ts";

export type ApiClient = ReturnType<typeof createApiClient>;

export interface BudgetSpent {
  sum: string;
  currencyCode: string;
  decimalPlaces: number;
}

export interface BudgetRecord {
  id: string;
  name: string;
  active: boolean;
  order: number;
  notes: string | null;
  autoBudgetType: string;
  autoBudgetAmount: string | null;
  autoBudgetPeriod: string | null;
  currencyCode: string;
  decimalPlaces: number;
  spent: readonly BudgetSpent[];
}

export interface BudgetLimit {
  id: string;
  budgetId: string;
  start: string;
  end: string;
  amount: string;
  currencyCode: string;
  decimalPlaces: number;
}

export interface AvailableBudget {
  id: string;
  amount: string;
  currencyCode: string;
  decimalPlaces: number;
  start: string | null;
  end: string | null;
  spent: string | null;
}

export const AUTO_BUDGET_TYPES = [
  { value: "none", label: "No automatic budget" },
  { value: "reset", label: "Reset every period" },
  { value: "rollover", label: "Roll over unused amount" },
  { value: "adjusted", label: "Adjusted rollover" },
] as const;

export const AUTO_BUDGET_PERIODS = [
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

export function mapBudgets(payload: unknown): BudgetRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const id = text(resource.id);
    const attributes = asRecord(resource.attributes);
    const name = text(attributes.name);
    if (!id || !name) return [];
    const spentRaw = Array.isArray(attributes.spent) ? attributes.spent : [];
    return [
      {
        id,
        name,
        active: attributes.active !== false,
        order: numberValue(attributes.order),
        notes: nullableText(attributes.notes),
        autoBudgetType: text(attributes.auto_budget_type) || "none",
        autoBudgetAmount: nullableText(attributes.auto_budget_amount),
        autoBudgetPeriod: nullableText(attributes.auto_budget_period),
        currencyCode:
          text(attributes.currency_code) ||
          text(attributes.primary_currency_code),
        decimalPlaces: numberValue(
          attributes.currency_decimal_places ??
            attributes.primary_currency_decimal_places,
          2,
        ),
        spent: spentRaw.flatMap((item) => {
          const spent = asRecord(item);
          const sum = text(spent.sum);
          return sum
            ? [
                {
                  sum,
                  currencyCode: text(spent.currency_code),
                  decimalPlaces: numberValue(spent.currency_decimal_places, 2),
                },
              ]
            : [];
        }),
      },
    ];
  });
}

export function mapBudget(payload: unknown): BudgetRecord | null {
  return mapBudgets({ data: [asRecord(payload).data] })[0] ?? null;
}

export function mapBudgetLimits(payload: unknown): BudgetLimit[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const id = text(resource.id);
    const attributes = asRecord(resource.attributes);
    const amount = text(attributes.amount);
    if (!id || !amount) return [];
    return [
      {
        id,
        budgetId: text(attributes.budget_id),
        start: text(attributes.start),
        end: text(attributes.end),
        amount,
        currencyCode: text(attributes.currency_code),
        decimalPlaces: numberValue(attributes.currency_decimal_places, 2),
      },
    ];
  });
}

export function mapAvailableBudgets(payload: unknown): AvailableBudget[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const id = text(resource.id);
    const attributes = asRecord(resource.attributes);
    const amount = text(attributes.amount);
    if (!id) return [];
    const spentRaw = Array.isArray(attributes.spent) ? attributes.spent : [];
    const firstSpent = asRecord(spentRaw[0]);
    return [
      {
        id,
        amount,
        currencyCode: text(attributes.currency_code),
        decimalPlaces: numberValue(attributes.currency_decimal_places, 2),
        start: nullableText(attributes.start),
        end: nullableText(attributes.end),
        spent: nullableText(firstSpent.sum),
      },
    ];
  });
}

export interface BudgetDraft {
  name: string;
  active: boolean;
  order: string;
  notes: string;
  autoBudgetType: string;
  autoBudgetAmount: string;
  autoBudgetPeriod: string;
  currencyCode: string;
}

export function validateBudgetDraft(draft: BudgetDraft): {
  ok: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = "Enter a budget name.";
  else if (draft.name.trim().length > 255)
    errors.name = "Use 255 characters or fewer.";
  if (draft.order && !/^\d+$/.test(draft.order))
    errors.order = "Order must be a whole number.";
  if (draft.autoBudgetType !== "none") {
    if (
      !/^\d+(?:\.\d+)?$/.test(draft.autoBudgetAmount) ||
      Number(draft.autoBudgetAmount) <= 0
    )
      errors.autoBudgetAmount = "Enter a positive automatic budget amount.";
    if (
      !AUTO_BUDGET_PERIODS.includes(
        draft.autoBudgetPeriod as (typeof AUTO_BUDGET_PERIODS)[number],
      )
    )
      errors.autoBudgetPeriod = "Choose a supported automatic budget period.";
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function budgetPayload(draft: BudgetDraft): Record<string, unknown> {
  return {
    name: draft.name.trim(),
    active: draft.active,
    ...(draft.order ? { order: Number(draft.order) } : {}),
    ...(draft.notes ? { notes: draft.notes } : {}),
    auto_budget_type: draft.autoBudgetType,
    ...(draft.autoBudgetType !== "none"
      ? {
          auto_budget_amount: draft.autoBudgetAmount,
          auto_budget_period: draft.autoBudgetPeriod,
          auto_budget_currency_code: draft.currencyCode,
        }
      : {}),
  };
}

export interface BudgetLimitDraft {
  start: string;
  end: string;
  amount: string;
  currencyCode: string;
}

export function validateBudgetLimitDraft(draft: BudgetLimitDraft): {
  ok: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.start))
    errors.start = "Enter a valid start date.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.end))
    errors.end = "Enter a valid end date.";
  if (draft.start && draft.end && draft.start >= draft.end)
    errors.end = "End date must be after the start date.";
  if (!/^\d+(?:\.\d+)?$/.test(draft.amount) || Number(draft.amount) <= 0)
    errors.amount = "Enter a positive decimal amount.";
  if (!draft.currencyCode) errors.currencyCode = "Choose a currency.";
  return { ok: Object.keys(errors).length === 0, errors };
}

export async function listBudgets(
  client: ApiClient,
  start?: string,
  end?: string,
): Promise<BudgetRecord[]> {
  const response = await client.request("budgets.index", {
    query: { limit: 100, ...(start ? { start } : {}), ...(end ? { end } : {}) },
  });
  return mapBudgets(response.data);
}

export async function getBudget(
  client: ApiClient,
  id: string,
): Promise<BudgetRecord | null> {
  const response = await client.request("budgets.show", {
    pathParameters: { budget: id },
  });
  return mapBudget(response.data);
}

export async function listBudgetLimits(
  client: ApiClient,
  id: string,
): Promise<BudgetLimit[]> {
  const response = await client.request("budgets.limits.index", {
    pathParameters: { budget: id },
    query: { limit: 100 },
  });
  return mapBudgetLimits(response.data);
}

export async function listAvailableBudgets(
  client: ApiClient,
): Promise<AvailableBudget[]> {
  const response = await client.request("available-budgets.index", {
    query: { limit: 100 },
  });
  return mapAvailableBudgets(response.data);
}

export async function budgetTransactions(
  client: ApiClient,
  id: string,
  start?: string,
  end?: string,
): Promise<TransactionList> {
  const response = await client.request("budgets.transactions", {
    pathParameters: { budget: id },
    query: { limit: 25, ...(start ? { start } : {}), ...(end ? { end } : {}) },
  });
  return mapTransactionList(response.data);
}

export async function limitTransactions(
  client: ApiClient,
  budgetId: string,
  limitId: string,
): Promise<TransactionList> {
  const response = await client.request("budgets.limits.transactions", {
    pathParameters: { budget: budgetId, budgetLimit: limitId },
    query: { limit: 25 },
  });
  return mapTransactionList(response.data);
}

export async function transactionsWithoutBudget(
  client: ApiClient,
  start?: string,
  end?: string,
): Promise<TransactionList> {
  const response = await client.request("budgets.without-budget", {
    query: { limit: 25, ...(start ? { start } : {}), ...(end ? { end } : {}) },
  });
  return mapTransactionList(response.data);
}
