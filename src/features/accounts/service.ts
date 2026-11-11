import type { createApiClient } from "../../lib/api/client.ts";

export type ApiClient = ReturnType<typeof createApiClient>;

export interface AccountRecord {
  id: string;
  name: string;
  type: string;
  role: string | null;
  active: boolean;
  includeNetWorth: boolean;
  currentBalance: string;
  currencyCode: string;
  currencySymbol: string;
  decimalPlaces: number;
  openingBalance: string | null;
  openingBalanceDate: string | null;
  virtualBalance: string | null;
  iban: string | null;
  bic: string | null;
  accountNumber: string | null;
  notes: string | null;
  liabilityType: string | null;
  liabilityDirection: string | null;
  liabilityAmount: string | null;
  liabilityStartDate: string | null;
  interest: string | null;
  interestPeriod: string | null;
  creditCardType: string | null;
  monthlyPaymentDate: string | null;
  lastActivity: string | null;
}

export interface AccountList {
  accounts: readonly AccountRecord[];
  page: number;
  pageCount: number;
  total: number | null;
}

export const ACCOUNT_TYPES = [
  { value: "asset", label: "Asset" },
  { value: "expense", label: "Expense" },
  { value: "revenue", label: "Revenue" },
  { value: "liability", label: "Liability" },
] as const;

export const ASSET_ROLES = [
  { value: "defaultAsset", label: "Default asset (bank)" },
  { value: "sharedAsset", label: "Shared asset" },
  { value: "savingAsset", label: "Savings asset" },
  { value: "ccAsset", label: "Credit card asset" },
  { value: "cashWalletAsset", label: "Cash wallet" },
] as const;

export const LIABILITY_TYPES = [
  { value: "loan", label: "Loan" },
  { value: "debt", label: "Debt" },
  { value: "mortgage", label: "Mortgage" },
] as const;

export const LIABILITY_DIRECTIONS = [
  { value: "credit", label: "I owe (credit)" },
  { value: "debit", label: "Owed to me (debit)" },
] as const;

export const INTEREST_PERIODS = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "half-year",
  "yearly",
] as const;

export interface AccountDraft {
  name: string;
  type: string;
  accountRole: string;
  currencyCode: string;
  active: boolean;
  includeNetWorth: boolean;
  openingBalance: string;
  openingBalanceDate: string;
  virtualBalance: string;
  iban: string;
  bic: string;
  accountNumber: string;
  notes: string;
  creditCardType: string;
  monthlyPaymentDate: string;
  liabilityType: string;
  liabilityDirection: string;
  liabilityAmount: string;
  liabilityStartDate: string;
  interest: string;
  interestPeriod: string;
}

export type FieldErrors = Record<string, string>;

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

function bool(value: unknown, fallback = true): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function mapAccountResource(resource: unknown): AccountRecord | null {
  const root = asRecord(resource);
  const id = text(root.id);
  const attributes = asRecord(root.attributes);
  const name = text(attributes.name);
  const type = text(attributes.type);
  if (!id || !name || !type) return null;
  return {
    id,
    name,
    type,
    role: nullableText(attributes.account_role),
    active: bool(attributes.active),
    includeNetWorth: bool(attributes.include_net_worth),
    currentBalance: text(attributes.current_balance),
    currencyCode: text(attributes.currency_code),
    currencySymbol: text(attributes.currency_symbol),
    decimalPlaces: numberValue(attributes.currency_decimal_places, 2),
    openingBalance: nullableText(attributes.opening_balance),
    openingBalanceDate: nullableText(attributes.opening_balance_date),
    virtualBalance: nullableText(attributes.virtual_balance),
    iban: nullableText(attributes.iban),
    bic: nullableText(attributes.bic),
    accountNumber: nullableText(attributes.account_number),
    notes: nullableText(attributes.notes),
    liabilityType: nullableText(attributes.liability_type),
    liabilityDirection: nullableText(attributes.liability_direction),
    liabilityAmount: nullableText(attributes.liability_amount),
    liabilityStartDate: nullableText(attributes.liability_start_date),
    interest: nullableText(attributes.interest),
    interestPeriod: nullableText(attributes.interest_period),
    creditCardType: nullableText(attributes.credit_card_type),
    monthlyPaymentDate: nullableText(attributes.monthly_payment_date),
    lastActivity: nullableText(attributes.last_activity),
  };
}

export function mapAccountList(payload: unknown): AccountList {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  const accounts = data
    .map(mapAccountResource)
    .filter((account): account is AccountRecord => account !== null);
  const pagination = asRecord(asRecord(root.meta).pagination);
  return {
    accounts,
    page: numberValue(pagination.current_page, 1),
    pageCount: Math.max(1, numberValue(pagination.total_pages, 1)),
    total:
      typeof pagination.total === "number" && Number.isFinite(pagination.total)
        ? pagination.total
        : null,
  };
}

export function mapSingleAccount(payload: unknown): AccountRecord | null {
  const root = asRecord(payload);
  return mapAccountResource(root.data);
}

const LIABILITY_SET = new Set<string>(
  LIABILITY_TYPES.map((item) => item.value),
);
const ROLE_SET = new Set<string>(ASSET_ROLES.map((item) => item.value));
const TYPE_SET = new Set<string>(ACCOUNT_TYPES.map((item) => item.value));
const INTEREST_SET = new Set<string>(INTEREST_PERIODS);

function isAmount(value: string): boolean {
  return /^-?\d+(?:\.\d+)?$/.test(value);
}

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function validateAccountDraft(draft: AccountDraft): {
  ok: boolean;
  errors: FieldErrors;
} {
  const errors: FieldErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = "Enter an account name.";
  else if (name.length > 1024) errors.name = "Use 1024 characters or fewer.";
  if (!TYPE_SET.has(draft.type))
    errors.type = "Choose a supported account type.";
  if (draft.type === "asset") {
    if (!ROLE_SET.has(draft.accountRole))
      errors.accountRole = "Choose a supported asset role.";
    if (draft.accountRole === "ccAsset") {
      if (draft.creditCardType !== "monthlyFull")
        errors.creditCardType = "Choose a supported credit-card payment type.";
      if (!isDate(draft.monthlyPaymentDate))
        errors.monthlyPaymentDate =
          "Credit-card accounts require a monthly payment date.";
    }
  }
  if (draft.type === "liability") {
    if (!LIABILITY_SET.has(draft.liabilityType))
      errors.liabilityType = "Choose loan, debt or mortgage.";
    if (
      draft.liabilityDirection !== "credit" &&
      draft.liabilityDirection !== "debit"
    )
      errors.liabilityDirection = "Choose the liability direction.";
    const interest = Number(draft.interest);
    if (
      draft.interest === "" ||
      !Number.isFinite(interest) ||
      interest < 0 ||
      interest > 100
    )
      errors.interest = "Enter an interest rate from 0 to 100.";
    if (!INTEREST_SET.has(draft.interestPeriod))
      errors.interestPeriod = "Choose a supported interest period.";
    if ((draft.liabilityAmount === "") !== (draft.liabilityStartDate === "")) {
      errors.liabilityAmount =
        "Liability amount and start date must be provided together.";
    }
    if (draft.liabilityAmount && !isAmount(draft.liabilityAmount))
      errors.liabilityAmount = "Enter a decimal liability amount.";
    if (draft.liabilityStartDate && !isDate(draft.liabilityStartDate))
      errors.liabilityStartDate = "Enter a valid liability start date.";
  }
  if (draft.openingBalance && !isAmount(draft.openingBalance))
    errors.openingBalance = "Enter a decimal opening balance.";
  if ((draft.openingBalance === "") !== (draft.openingBalanceDate === "")) {
    errors.openingBalance =
      "Opening balance and opening balance date must be provided together.";
  }
  if (draft.openingBalanceDate && !isDate(draft.openingBalanceDate))
    errors.openingBalanceDate = "Enter a valid opening balance date.";
  if (draft.virtualBalance && !isAmount(draft.virtualBalance))
    errors.virtualBalance = "Enter a decimal virtual balance.";
  if (draft.notes.length > 32768) errors.notes = "Notes are too long.";
  return { ok: Object.keys(errors).length === 0, errors };
}

export function accountPayload(draft: AccountDraft): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: draft.name.trim(),
    type: draft.type,
    active: draft.active,
    include_net_worth: draft.includeNetWorth,
    currency_code: draft.currencyCode,
  };
  const optional: Array<[string, string]> = [
    ["opening_balance", draft.openingBalance],
    ["opening_balance_date", draft.openingBalanceDate],
    ["virtual_balance", draft.virtualBalance],
    ["iban", draft.iban.trim()],
    ["bic", draft.bic.trim()],
    ["account_number", draft.accountNumber.trim()],
    ["notes", draft.notes],
  ];
  for (const [key, value] of optional) {
    if (value !== "") payload[key] = value;
  }
  if (draft.type === "asset") {
    payload.account_role = draft.accountRole;
    if (draft.accountRole === "ccAsset") {
      payload.credit_card_type = draft.creditCardType;
      payload.monthly_payment_date = draft.monthlyPaymentDate;
    }
  }
  if (draft.type === "liability") {
    payload.liability_type = draft.liabilityType;
    payload.liability_direction = draft.liabilityDirection;
    payload.interest = draft.interest;
    payload.interest_period = draft.interestPeriod;
    if (draft.liabilityAmount) {
      payload.liability_amount = draft.liabilityAmount;
      payload.liability_start_date = draft.liabilityStartDate;
    }
  }
  return payload;
}

export async function listAccounts(
  client: ApiClient,
  options: {
    type?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  } = {},
): Promise<AccountList> {
  const response = await client.request("accounts.index", {
    query: {
      limit: options.limit ?? 50,
      page: options.page ?? 1,
      ...(options.type && options.type !== "all" ? { type: options.type } : {}),
      ...(options.active === undefined ? {} : { active: options.active }),
    },
  });
  return mapAccountList(response.data);
}

export async function getAccount(
  client: ApiClient,
  id: string,
): Promise<AccountRecord | null> {
  const response = await client.request("accounts.show", {
    pathParameters: { account: id },
  });
  return mapSingleAccount(response.data);
}

export function accountTypeLabel(type: string, role: string | null): string {
  const base = ACCOUNT_TYPES.find((item) => item.value === type)?.label ?? type;
  if (type !== "asset" || !role) return base;
  const roleLabel = ASSET_ROLES.find((item) => item.value === role)?.label;
  return roleLabel ? `${base} / ${roleLabel}` : base;
}
