import type { createApiClient } from "../../lib/api/client.ts";

export type ApiClient = ReturnType<typeof createApiClient>;
export interface MoneyValue {
  value: string;
  currencyCode: string;
  decimalPlaces: number;
}
export interface ChartPoint {
  label: string;
  value: string;
  currencyCode: string;
  decimalPlaces: number;
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

export function mapSummary(payload: unknown): Record<string, MoneyValue> {
  const root = asRecord(payload);
  const result: Record<string, MoneyValue> = {};
  for (const [key, value] of Object.entries(root)) {
    const item = asRecord(value);
    if (typeof item.value === "string" || typeof item.value === "number") {
      result[key] = {
        value: String(item.value),
        currencyCode: text(item.currency_code),
        decimalPlaces: num(item.currency_decimal_places),
      };
    }
  }
  return result;
}

export function mapChart(payload: unknown): ChartPoint[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data)
    ? root.data
    : Array.isArray(payload)
      ? payload
      : [];
  return data.flatMap((value) => {
    const item = asRecord(value);
    const label = text(item.label) || text(item.period) || text(item.date);
    const raw =
      item.balance ?? item.amount ?? item.value ?? item.monetary_value;
    if (!label || raw === undefined || raw === null) return [];
    return [
      {
        label,
        value: String(raw),
        currencyCode: text(item.currency_code),
        decimalPlaces: num(item.currency_decimal_places),
      },
    ];
  });
}

export function mapInsights(payload: unknown): ChartPoint[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data)
    ? root.data
    : Array.isArray(payload)
      ? payload
      : [];
  return data.flatMap((value) => {
    const item = asRecord(value);
    const label = text(item.title) || text(item.key);
    const raw = (item.monetary_value ?? item.amount ?? item.value) as unknown;
    if (!label || raw === undefined || raw === null) return [];
    return [
      {
        label,
        value: String(raw),
        currencyCode: text(item.currency_code),
        decimalPlaces: num(item.currency_decimal_places),
      },
    ];
  });
}

export async function getSummary(
  client: ApiClient,
  start: string,
  end: string,
): Promise<Record<string, MoneyValue>> {
  const response = await client.request("summary.basic", {
    query: { start, end },
  });
  return mapSummary(response.data);
}
export async function getChart(
  client: ApiClient,
  operation:
    | "chart.balance.balance"
    | "chart.account.overview"
    | "chart.budget.overview"
    | "chart.budget.overview-with-limits"
    | "chart.category.overview",
  start: string,
  end: string,
): Promise<ChartPoint[]> {
  const response = await client.request(operation, { query: { start, end } });
  return mapChart(response.data);
}

export function rangeFromKey(key: string | undefined): {
  start: string;
  end: string;
  label: string;
} {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  if (key === "last-30-days") {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 29);
    return {
      start: start.toISOString().slice(0, 10),
      end,
      label: "Last 30 days",
    };
  }
  if (key === "year-to-date") {
    return {
      start: `${now.getUTCFullYear()}-01-01`,
      end,
      label: "Year to date",
    };
  }
  if (key === "all") {
    return { start: "2000-01-01", end, label: "All time" };
  }
  return { start: first.toISOString().slice(0, 10), end, label: "This month" };
}

export type InsightOperation =
  | "insight.expense.expense"
  | "insight.expense.asset"
  | "insight.expense.total"
  | "insight.expense.bill"
  | "insight.expense.no-bill"
  | "insight.expense.subscription"
  | "insight.expense.no-subscription"
  | "insight.expense.budget"
  | "insight.expense.no-budget"
  | "insight.expense.category"
  | "insight.expense.no-category"
  | "insight.expense.tag"
  | "insight.expense.no-tag"
  | "insight.income.revenue"
  | "insight.income.asset"
  | "insight.income.total"
  | "insight.income.category"
  | "insight.income.no-category"
  | "insight.income.tag"
  | "insight.income.no-tag"
  | "insight.transfer.asset"
  | "insight.transfer.category"
  | "insight.transfer.no-category"
  | "insight.transfer.tag"
  | "insight.transfer.no-tag"
  | "insight.transfer.total";

export async function getInsight(
  client: ApiClient,
  operation: InsightOperation,
  start: string,
  end: string,
): Promise<ChartPoint[]> {
  const response = await client.request(operation, { query: { start, end } });
  return mapInsights(response.data);
}

export const INSIGHT_OPTIONS: readonly {
  value: InsightOperation;
  label: string;
  family: string;
}[] = [
  {
    value: "insight.expense.expense",
    label: "Expenses by account",
    family: "expense",
  },
  {
    value: "insight.expense.asset",
    label: "Expenses from asset",
    family: "expense",
  },
  {
    value: "insight.expense.total",
    label: "Total expenses",
    family: "expense",
  },
  {
    value: "insight.expense.bill",
    label: "Expenses by subscription",
    family: "expense",
  },
  {
    value: "insight.expense.no-bill",
    label: "Expenses without subscription",
    family: "expense",
  },
  {
    value: "insight.expense.subscription",
    label: "Expenses by subscription",
    family: "expense",
  },
  {
    value: "insight.expense.no-subscription",
    label: "Expenses without subscription",
    family: "expense",
  },
  {
    value: "insight.expense.budget",
    label: "Expenses by budget",
    family: "expense",
  },
  {
    value: "insight.expense.no-budget",
    label: "Expenses without budget",
    family: "expense",
  },
  {
    value: "insight.expense.category",
    label: "Expenses by category",
    family: "expense",
  },
  {
    value: "insight.expense.no-category",
    label: "Expenses without category",
    family: "expense",
  },
  { value: "insight.expense.tag", label: "Expenses by tag", family: "expense" },
  {
    value: "insight.expense.no-tag",
    label: "Expenses without tag",
    family: "expense",
  },
  {
    value: "insight.income.revenue",
    label: "Income by revenue",
    family: "income",
  },
  { value: "insight.income.asset", label: "Income by asset", family: "income" },
  { value: "insight.income.total", label: "Total income", family: "income" },
  {
    value: "insight.income.category",
    label: "Income by category",
    family: "income",
  },
  {
    value: "insight.income.no-category",
    label: "Income without category",
    family: "income",
  },
  { value: "insight.income.tag", label: "Income by tag", family: "income" },
  {
    value: "insight.income.no-tag",
    label: "Income without tag",
    family: "income",
  },
  {
    value: "insight.transfer.asset",
    label: "Transfers by asset",
    family: "transfer",
  },
  {
    value: "insight.transfer.category",
    label: "Transfers by category",
    family: "transfer",
  },
  {
    value: "insight.transfer.no-category",
    label: "Transfers without category",
    family: "transfer",
  },
  {
    value: "insight.transfer.tag",
    label: "Transfers by tag",
    family: "transfer",
  },
  {
    value: "insight.transfer.no-tag",
    label: "Transfers without tag",
    family: "transfer",
  },
  {
    value: "insight.transfer.total",
    label: "Total transfers",
    family: "transfer",
  },
];
