import type { createApiClient } from "../../lib/api/client.ts";
import { ApiClientError } from "../../lib/api/client.ts";

export type ApiClient = ReturnType<typeof createApiClient>;

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  enabled: boolean;
}

export interface AccountSummary {
  id: string;
  name: string;
  type: string;
  role: string | null;
  currencyCode: string | null;
}

export interface OnboardingState {
  configured: boolean;
  accounts: AccountSummary[];
  currencies: CurrencyOption[];
}

export interface AccountChoice {
  role: "defaultAsset" | "savingAsset" | "cashWalletAsset";
  name: string;
}

export interface OnboardingInput {
  currencyCode: string;
  accounts: readonly AccountChoice[];
}

export const DEFAULT_ACCOUNT_CHOICES: readonly AccountChoice[] = [
  { role: "defaultAsset", name: "Everyday account" },
  { role: "savingAsset", name: "Savings account" },
  { role: "cashWalletAsset", name: "Cash wallet" },
];

export const OPTIONAL_TRANSACTION_FIELDS = {
  interest_date: true,
  book_date: false,
  process_date: false,
  due_date: false,
  payment_date: false,
  invoice_date: false,
  internal_reference: false,
  notes: true,
  attachments: true,
} as const;

interface JsonApiResource {
  id?: unknown;
  attributes?: unknown;
}

interface JsonApiCollection {
  data?: unknown;
}

function stringAttribute(
  attributes: Record<string, unknown>,
  key: string,
): string | null {
  const value = attributes[key];
  return typeof value === "string" ? value : null;
}

function resourceList(payload: unknown): JsonApiResource[] {
  if (typeof payload !== "object" || payload === null) return [];
  const data = (payload as JsonApiCollection).data;
  if (Array.isArray(data)) {
    return data.filter(
      (item): item is JsonApiResource =>
        typeof item === "object" && item !== null,
    );
  }
  if (typeof data === "object" && data !== null) {
    return [data as JsonApiResource];
  }
  return [];
}

export function mapAccounts(payload: unknown): AccountSummary[] {
  return resourceList(payload).flatMap((resource) => {
    if (typeof resource.id !== "string") return [];
    const attributes =
      typeof resource.attributes === "object" && resource.attributes !== null
        ? (resource.attributes as Record<string, unknown>)
        : {};
    const name = stringAttribute(attributes, "name");
    const type = stringAttribute(attributes, "type");
    if (!name || !type) return [];
    return [
      {
        id: resource.id,
        name,
        type,
        role: stringAttribute(attributes, "account_role"),
        currencyCode: stringAttribute(attributes, "currency_code"),
      },
    ];
  });
}

export function mapCurrencies(payload: unknown): CurrencyOption[] {
  return resourceList(payload).flatMap((resource) => {
    const attributes =
      typeof resource.attributes === "object" && resource.attributes !== null
        ? (resource.attributes as Record<string, unknown>)
        : {};
    const code = stringAttribute(attributes, "code");
    const name = stringAttribute(attributes, "name");
    if (!code || !name) return [];
    const decimalPlaces = attributes.decimal_places;
    const symbol = stringAttribute(attributes, "symbol") ?? code;
    return [
      {
        code,
        name,
        symbol,
        decimalPlaces:
          typeof decimalPlaces === "number" && Number.isInteger(decimalPlaces)
            ? decimalPlaces
            : 2,
        enabled: attributes.enabled === true,
      },
    ];
  });
}

export async function loadOnboardingState(
  client: ApiClient,
): Promise<OnboardingState> {
  const [accountsResponse, currenciesResponse] = await Promise.all([
    client.request("accounts.index", { query: { limit: 100 } }),
    client.request("currencies.index", { query: { limit: 100 } }),
  ]);
  const accounts = mapAccounts(accountsResponse.data);
  return {
    configured: accounts.some((account) => account.type === "asset"),
    accounts,
    currencies: mapCurrencies(currenciesResponse.data).sort((left, right) =>
      left.code.localeCompare(right.code),
    ),
  };
}

export interface OnboardingValidation {
  ok: boolean;
  errors: readonly string[];
  input?: OnboardingInput;
}

export function validateOnboardingInput(
  payload: unknown,
): OnboardingValidation {
  const errors: string[] = [];
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, errors: ["The setup request was not valid."] };
  }
  const record = payload as Record<string, unknown>;
  const currencyCode =
    typeof record.currencyCode === "string"
      ? record.currencyCode.trim().toUpperCase()
      : "";
  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    errors.push("Choose a valid three-letter currency code.");
  }

  const rawAccounts = Array.isArray(record.accounts) ? record.accounts : [];
  if (rawAccounts.length !== DEFAULT_ACCOUNT_CHOICES.length) {
    errors.push("Provide names for all three starting accounts.");
  }

  const accounts: AccountChoice[] = [];
  DEFAULT_ACCOUNT_CHOICES.forEach((definition, index) => {
    const raw = rawAccounts[index];
    const name =
      typeof raw === "object" &&
      raw !== null &&
      typeof (raw as Record<string, unknown>).name === "string"
        ? ((raw as Record<string, unknown>).name as string).trim()
        : "";
    if (!name || name.length > 1024) {
      errors.push(`Enter a name for the ${definition.role} account.`);
    }
    accounts.push({ role: definition.role, name });
  });

  const seen = new Set<string>();
  for (const account of accounts) {
    const key = account.name.toLowerCase();
    if (key && seen.has(key)) {
      errors.push("Account names must be unique.");
      break;
    }
    seen.add(key);
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    errors: [],
    input: { currencyCode, accounts },
  };
}

export function planAccountCreations(
  existingAccounts: readonly AccountSummary[],
  choices: readonly AccountChoice[],
): AccountChoice[] {
  const existingNames = new Set(
    existingAccounts
      .filter((account) => account.type === "asset")
      .map((account) => account.name.trim().toLowerCase()),
  );
  return choices.filter(
    (choice) => !existingNames.has(choice.name.trim().toLowerCase()),
  );
}

export interface OnboardingResult {
  created: AccountSummary[];
  skipped: number;
}

export async function runOnboarding(
  client: ApiClient,
  input: OnboardingInput,
): Promise<OnboardingResult> {
  const current = await loadOnboardingState(client);

  await client.request("currencies.primary", {
    pathParameters: { currencyCode: input.currencyCode },
  });

  const missing = planAccountCreations(current.accounts, input.accounts);
  const created: AccountSummary[] = [];

  for (const choice of missing) {
    const response = await client.request("accounts.store", {
      body: {
        name: choice.name,
        type: "asset",
        account_role: choice.role,
        currency_code: input.currencyCode,
        include_net_worth: true,
        active: true,
      },
    });
    created.push(...mapAccounts(response.data));
  }

  const refreshed = await loadOnboardingState(client);
  const assetAccountIds = refreshed.accounts
    .filter((account) => account.type === "asset")
    .map((account) => Number(account.id))
    .filter((id) => Number.isSafeInteger(id));

  if (assetAccountIds.length > 0) {
    await client.request("preferences.store", {
      body: { name: "frontpageAccounts", data: assetAccountIds },
    });
  }

  await client.request("preferences.store", {
    body: {
      name: "transaction_journal_optional_fields",
      data: OPTIONAL_TRANSACTION_FIELDS,
    },
  });

  return {
    created,
    skipped: input.accounts.length - missing.length,
  };
}

export function describeOnboardingError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 409) {
      return "Setup changed while it was saving. Reload the page to continue from the current accounts.";
    }
    if (error.status === 422) {
      return "Firefly rejected one or more setup fields. Check the account names and currency, then try again.";
    }
    return error.message;
  }
  return "Setup could not be completed. Check the connection and try again.";
}
