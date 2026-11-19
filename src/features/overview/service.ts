import type { ApiClient } from "../analysis/service.ts";
import {
  getChart,
  getInsight,
  getSummary,
  type ChartPoint as AnalysisChartPoint,
  type MoneyValue,
} from "../analysis/service.ts";
import { listAccounts, type AccountRecord } from "../accounts/service.ts";
import {
  listBudgetLimits,
  listBudgets,
  type BudgetLimit,
  type BudgetRecord,
} from "../budgets/service.ts";
import {
  listPiggyBanks,
  type PiggyBankRecord,
} from "../piggy-banks/service.ts";
import { listPreferences, preferenceValue } from "../preferences/service.ts";
import { listBills, type BillRecord } from "../subscriptions/service.ts";
import {
  listTransactions,
  type TransactionGroupView,
} from "../transactions/service.ts";

export interface OverviewRange {
  start: string;
  end: string;
  label: string;
}

export interface SummaryEntry extends MoneyValue {
  key: string;
  kind: string;
}

export interface OverviewBudget {
  budget: BudgetRecord;
  limit: BudgetLimit | null;
}

export interface OverviewData {
  range: OverviewRange;
  summary: Record<string, MoneyValue>;
  summaryEntries: readonly SummaryEntry[];
  balance: readonly AnalysisChartPoint[];
  income: readonly AnalysisChartPoint[];
  expense: readonly AnalysisChartPoint[];
  accounts: readonly AccountRecord[];
  transactions: readonly TransactionGroupView[];
  budgets: readonly OverviewBudget[];
  bills: readonly BillRecord[];
  piggyBanks: readonly PiggyBankRecord[];
  errors: readonly string[];
}

function fulfilled<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

function dismissed(
  label: string,
  result: PromiseSettledResult<unknown>,
): string[] {
  return result.status === "rejected" ? [`${label} could not be loaded.`] : [];
}

export function summaryEntries(
  summary: Record<string, MoneyValue>,
): SummaryEntry[] {
  return Object.entries(summary).flatMap(([key, value]) => {
    const match = /^(.+)-in-([A-Z]{3})$/.exec(key);
    if (!match) return [];
    return [{ ...value, key, kind: match[1] }];
  });
}

export function summaryByKind(
  summary: Record<string, MoneyValue>,
  kind: string,
): SummaryEntry[] {
  return summaryEntries(summary).filter((entry) => entry.kind === kind);
}

function accountIdsFromPreferences(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export async function loadOverview(
  client: ApiClient,
  range: OverviewRange,
): Promise<OverviewData> {
  const [
    summaryResult,
    balanceResult,
    incomeResult,
    expenseResult,
    accountsResult,
    transactionsResult,
    budgetsResult,
    billsResult,
    piggyResult,
    preferencesResult,
  ] = await Promise.allSettled([
    getSummary(client, range.start, range.end),
    getChart(client, "chart.balance.balance", range.start, range.end),
    getInsight(client, "insight.income.total", range.start, range.end),
    getInsight(client, "insight.expense.total", range.start, range.end),
    listAccounts(client, { limit: 100, active: true }),
    listTransactions(client, {
      limit: 8,
      start: range.start,
      end: range.end,
    }),
    listBudgets(client, range.start, range.end),
    listBills(client),
    listPiggyBanks(client),
    listPreferences(client),
  ]);

  const summary = fulfilled(summaryResult) ?? {};
  const accounts = fulfilled(accountsResult)?.accounts ?? [];
  const preferences = fulfilled(preferencesResult) ?? [];
  const frontpageIds = accountIdsFromPreferences(
    preferenceValue(preferences, "frontpageAccounts"),
  );
  const selectedAccounts =
    frontpageIds.length > 0
      ? accounts.filter((account) => frontpageIds.includes(account.id))
      : accounts;
  const visibleAccounts = selectedAccounts
    .filter(
      (account) => account.type === "asset" || account.type === "liability",
    )
    .sort((left, right) => {
      if (left.type !== right.type) return left.type === "asset" ? -1 : 1;
      return left.name.localeCompare(right.name);
    });

  const budgets = fulfilled(budgetsResult) ?? [];
  const budgetsWithLimits = await Promise.all(
    budgets.slice(0, 6).map(async (budget): Promise<OverviewBudget> => {
      try {
        const limits = await listBudgetLimits(client, budget.id);
        const current = limits.find(
          (limit) => limit.start <= range.end && limit.end >= range.start,
        );
        return { budget, limit: current ?? limits[0] ?? null };
      } catch {
        return { budget, limit: null };
      }
    }),
  );

  const bills = (fulfilled(billsResult) ?? [])
    .filter((bill) => bill.active)
    .sort((left, right) => {
      const leftDate = left.nextExpectedMatch ?? "9999-12-31";
      const rightDate = right.nextExpectedMatch ?? "9999-12-31";
      return leftDate.localeCompare(rightDate);
    })
    .slice(0, 6);

  const errors = [
    ...dismissed("Summary", summaryResult),
    ...dismissed("Balance chart", balanceResult),
    ...dismissed("Income", incomeResult),
    ...dismissed("Expenses", expenseResult),
    ...dismissed("Accounts", accountsResult),
    ...dismissed("Recent transactions", transactionsResult),
    ...dismissed("Budgets", budgetsResult),
    ...dismissed("Subscriptions", billsResult),
    ...dismissed("Savings goals", piggyResult),
  ];

  return {
    range,
    summary,
    summaryEntries: summaryEntries(summary),
    balance: fulfilled(balanceResult) ?? [],
    income: fulfilled(incomeResult) ?? [],
    expense: fulfilled(expenseResult) ?? [],
    accounts: visibleAccounts,
    transactions: fulfilled(transactionsResult)?.groups ?? [],
    budgets: budgetsWithLimits,
    bills,
    piggyBanks: (fulfilled(piggyResult) ?? []).slice(0, 5),
    errors,
  };
}

export function chartLabel(points: readonly AnalysisChartPoint[]): string {
  if (points.length === 0) return "No chart data reported.";
  const first = points[0];
  const last = points[points.length - 1];
  return `${first.label}: ${first.value} ${first.currencyCode} → ${last.label}: ${last.value} ${last.currencyCode}.`;
}
