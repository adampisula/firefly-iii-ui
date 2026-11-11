import type { createApiClient } from "../../lib/api/client.ts";

export type ApiClient = ReturnType<typeof createApiClient>;

export interface AutocompleteFamily {
  id: string;
  label: string;
  operation:
    | "autocomplete.accounts"
    | "autocomplete.bills"
    | "autocomplete.subscriptions"
    | "autocomplete.budgets"
    | "autocomplete.categories"
    | "autocomplete.currencies"
    | "autocomplete.object-groups"
    | "autocomplete.piggy-banks"
    | "autocomplete.recurring"
    | "autocomplete.rules"
    | "autocomplete.rule-groups"
    | "autocomplete.tags"
    | "autocomplete.transactions"
    | "autocomplete.transactions-with-meta"
    | "autocomplete.transaction-types";
  supportsTypes: boolean;
  supportsDate: boolean;
  allowsCreateByText: boolean;
  description: string;
}

export const AUTOCOMPLETE_FAMILIES: readonly AutocompleteFamily[] = [
  {
    id: "accounts",
    label: "Accounts",
    operation: "autocomplete.accounts",
    supportsTypes: true,
    supportsDate: true,
    allowsCreateByText: false,
    description:
      "Asset, expense, revenue and liability accounts with optional balances at a date.",
  },
  {
    id: "bills",
    label: "Subscriptions and bills",
    operation: "autocomplete.bills",
    supportsTypes: false,
    supportsDate: false,
    allowsCreateByText: false,
    description:
      "Subscription/bill names. The subscriptions alias shares this contract.",
  },
  {
    id: "subscriptions",
    label: "Subscriptions alias",
    operation: "autocomplete.subscriptions",
    supportsTypes: false,
    supportsDate: false,
    allowsCreateByText: false,
    description:
      "Canonical subscriptions alias; keep both declarations visible.",
  },
  {
    id: "budgets",
    label: "Budgets",
    operation: "autocomplete.budgets",
    supportsTypes: false,
    supportsDate: false,
    allowsCreateByText: false,
    description:
      "Budget names, including inactive budgets where the backend returns them.",
  },
  {
    id: "categories",
    label: "Categories",
    operation: "autocomplete.categories",
    supportsTypes: false,
    supportsDate: false,
    allowsCreateByText: true,
    description:
      "Category names; free-text creation belongs to the category editor.",
  },
  {
    id: "currencies",
    label: "Currencies",
    operation: "autocomplete.currencies",
    supportsTypes: false,
    supportsDate: false,
    allowsCreateByText: false,
    description: "Currency codes and names.",
  },
  {
    id: "object-groups",
    label: "Object groups",
    operation: "autocomplete.object-groups",
    supportsTypes: false,
    supportsDate: false,
    allowsCreateByText: false,
    description: "Object-group names.",
  },
  {
    id: "piggy-banks",
    label: "Piggy banks",
    operation: "autocomplete.piggy-banks",
    supportsTypes: false,
    supportsDate: false,
    allowsCreateByText: false,
    description: "Piggy-bank names.",
  },
  {
    id: "recurring",
    label: "Recurrences",
    operation: "autocomplete.recurring",
    supportsTypes: false,
    supportsDate: false,
    allowsCreateByText: false,
    description: "Recurring transaction names.",
  },
  {
    id: "rules",
    label: "Rules",
    operation: "autocomplete.rules",
    supportsTypes: false,
    supportsDate: false,
    allowsCreateByText: false,
    description: "Rule titles.",
  },
  {
    id: "rule-groups",
    label: "Rule groups",
    operation: "autocomplete.rule-groups",
    supportsTypes: false,
    supportsDate: false,
    allowsCreateByText: false,
    description: "Rule-group titles.",
  },
  {
    id: "tags",
    label: "Tags",
    operation: "autocomplete.tags",
    supportsTypes: false,
    supportsDate: false,
    allowsCreateByText: true,
    description:
      "Tag names; free-text creation belongs to the transaction editor.",
  },
  {
    id: "transactions",
    label: "Transaction descriptions",
    operation: "autocomplete.transactions",
    supportsTypes: false,
    supportsDate: true,
    allowsCreateByText: false,
    description:
      "Existing transaction journals with group and journal identities preserved.",
  },
  {
    id: "transactions-with-meta",
    label: "Transactions with metadata",
    operation: "autocomplete.transactions-with-meta",
    supportsTypes: false,
    supportsDate: true,
    allowsCreateByText: false,
    description:
      "Transaction journals including amounts, currency and category metadata.",
  },
  {
    id: "transaction-types",
    label: "Transaction types",
    operation: "autocomplete.transaction-types",
    supportsTypes: false,
    supportsDate: false,
    allowsCreateByText: false,
    description: "Withdrawal, deposit and transfer type labels.",
  },
];

export function findAutocompleteFamily(
  id: string,
): AutocompleteFamily | undefined {
  return AUTOCOMPLETE_FAMILIES.find((family) => family.id === id);
}

export interface AutocompleteOption {
  id: string;
  label: string;
  description?: string;
}

export interface SearchTransactionJournal {
  journalId: string;
  description: string;
  amount: string;
  currencyCode: string;
  currencySymbol: string;
  decimalPlaces: number;
  date: string;
  type: string;
  sourceName: string;
  destinationName: string;
  categoryName: string | null;
  budgetName: string | null;
  reconciled: boolean;
  tags: readonly string[];
}

export interface SearchTransactionGroup {
  id: string;
  title: string;
  journals: readonly SearchTransactionJournal[];
}

export interface SearchResults {
  groups: readonly SearchTransactionGroup[];
  page: number;
  pageCount: number;
  total: number | null;
  count: number;
}

export interface AccountSearchResult {
  id: string;
  name: string;
  type: string;
  role: string | null;
  active: boolean;
  currencyCode: string;
  decimalPlaces: number;
  currentBalance: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizeAutocomplete(payload: unknown): AutocompleteOption[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((entry) => {
    const record = asRecord(entry);
    const id = text(record.id);
    if (!id) return [];
    const label =
      text(record.name) || text(record.name_with_balance) || text(record.label);
    if (!label) return [];
    const detailParts = [
      text(record.type),
      text(record.currency_code),
      record.active === false ? "inactive" : "",
    ].filter(Boolean);
    return [
      {
        id,
        label,
        ...(detailParts.length > 0
          ? { description: detailParts.join(" · ") }
          : {}),
      },
    ];
  });
}

function mapJournal(value: unknown): SearchTransactionJournal | null {
  const record = asRecord(value);
  const journalId = text(record.transaction_journal_id);
  if (!journalId) return null;
  return {
    journalId,
    description: text(record.description),
    amount: text(record.amount),
    currencyCode: text(record.currency_code),
    currencySymbol: text(record.currency_symbol),
    decimalPlaces: numberValue(record.currency_decimal_places, 2),
    date: text(record.date),
    type: text(record.type),
    sourceName: text(record.source_name),
    destinationName: text(record.destination_name),
    categoryName: text(record.category_name) || null,
    budgetName: text(record.budget_name) || null,
    reconciled: record.reconciled === true,
    tags: Array.isArray(record.tags)
      ? record.tags.filter((tag) => typeof tag === "string")
      : [],
  };
}

export function mapSearchResults(payload: unknown): SearchResults {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  const groups = data.flatMap((value) => {
    const resource = asRecord(value);
    const id = text(resource.id);
    const attributes = asRecord(resource.attributes);
    if (!id) return [];
    const journals = Array.isArray(attributes.transactions)
      ? attributes.transactions
          .map(mapJournal)
          .filter(
            (journal): journal is SearchTransactionJournal => journal !== null,
          )
      : [];
    return [
      {
        id,
        title:
          text(attributes.group_title) ||
          journals[0]?.description ||
          `Group ${id}`,
        journals,
      },
    ];
  });
  const pagination = asRecord(asRecord(root.meta).pagination);
  return {
    groups,
    page: numberValue(pagination.current_page, 1),
    pageCount: Math.max(1, numberValue(pagination.total_pages, 1)),
    total:
      typeof pagination.total === "number" && Number.isFinite(pagination.total)
        ? pagination.total
        : null,
    count: groups.reduce((sum, group) => sum + group.journals.length, 0),
  };
}

export function mapAccountSearch(payload: unknown): AccountSearchResult[] {
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
        type: text(attributes.type),
        role: text(attributes.account_role) || null,
        active: attributes.active !== false,
        currencyCode: text(attributes.currency_code),
        decimalPlaces: numberValue(attributes.currency_decimal_places, 2),
        currentBalance: text(attributes.current_balance),
      },
    ];
  });
}

export async function searchTransactions(
  client: ApiClient,
  query: string,
  page: number,
  limit = 20,
): Promise<SearchResults> {
  const response = await client.request("transactions.search", {
    query: { query, page, limit },
  });
  return mapSearchResults(response.data);
}

export async function searchTransactionCount(
  client: ApiClient,
  query: string,
): Promise<number> {
  const response = await client.request<{ count?: number }>(
    "search.transactions.count",
    { query: { query } },
  );
  return typeof response.data.count === "number" ? response.data.count : 0;
}

export async function searchAccounts(
  client: ApiClient,
  query: string,
  field = "all",
  type = "all",
): Promise<AccountSearchResult[]> {
  const response = await client.request("search.accounts", {
    query: { query, field, type },
  });
  return mapAccountSearch(response.data);
}
