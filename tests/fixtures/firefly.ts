export const fixtureUsers = [
  {
    id: "1",
    email: "owner@example.test",
    role: "owner",
    blocked: false,
    blocked_code: null,
  },
  {
    id: "2",
    email: "demo@example.test",
    role: "demo",
    blocked: false,
    blocked_code: null,
  },
  {
    id: "3",
    email: "blocked@example.test",
    role: "demo",
    blocked: true,
    blocked_code: "fixture-blocked",
  },
] as const;

export const fixtureAbout = {
  data: { version: "6.7.9", api_version: "v1" },
};

const eur = {
  id: "1",
  name: "Euro",
  code: "EUR",
  symbol: "€",
  decimal_places: 2,
};
const primaryEur = {
  id: "1",
  name: "Euro",
  code: "EUR",
  symbol: "€",
  decimal_places: 2,
};

const account = (id: string, attributes: Record<string, unknown>) => ({
  type: "accounts",
  id,
  attributes,
});

export const fixtureAccountsByUser = {
  owner: {
    data: [
      account("10", {
        active: true,
        name: "Everyday account",
        type: "asset",
        account_role: "defaultAsset",
        object_has_currency_setting: true,
        currency_id: eur.id,
        currency_name: eur.name,
        currency_code: eur.code,
        currency_symbol: eur.symbol,
        currency_decimal_places: eur.decimal_places,
        primary_currency_id: primaryEur.id,
        primary_currency_code: primaryEur.code,
        primary_currency_decimal_places: primaryEur.decimal_places,
        current_balance: "123456789012345.67",
        pc_current_balance: "123456789012345.67",
        include_net_worth: true,
      }),
      account("11", {
        active: true,
        name: "Long-term loan",
        type: "liability",
        account_role: null,
        object_has_currency_setting: true,
        currency_id: eur.id,
        currency_name: eur.name,
        currency_code: eur.code,
        currency_symbol: eur.symbol,
        currency_decimal_places: eur.decimal_places,
        primary_currency_id: primaryEur.id,
        primary_currency_code: primaryEur.code,
        primary_currency_decimal_places: primaryEur.decimal_places,
        current_balance: "-12000.00",
        pc_current_balance: "-12000.00",
        liability_type: "loan",
        liability_direction: "credit",
        interest: "0.0375",
        interest_period: "monthly",
        include_net_worth: true,
      }),
      account("12", {
        active: false,
        name: "Archived wallet",
        type: "asset",
        account_role: null,
        object_has_currency_setting: true,
        currency_id: eur.id,
        currency_name: eur.name,
        currency_code: eur.code,
        currency_symbol: eur.symbol,
        currency_decimal_places: eur.decimal_places,
        primary_currency_id: primaryEur.id,
        primary_currency_code: primaryEur.code,
        primary_currency_decimal_places: primaryEur.decimal_places,
        current_balance: "0.00",
        pc_current_balance: "0.00",
        include_net_worth: false,
      }),
    ],
  },
  demo: {
    data: [
      account("20", {
        active: true,
        name: "Demo cash",
        type: "asset",
        account_role: "defaultAsset",
        object_has_currency_setting: true,
        currency_id: eur.id,
        currency_name: eur.name,
        currency_code: eur.code,
        currency_symbol: eur.symbol,
        currency_decimal_places: eur.decimal_places,
        primary_currency_id: primaryEur.id,
        primary_currency_code: primaryEur.code,
        primary_currency_decimal_places: primaryEur.decimal_places,
        current_balance: "42.00",
        pc_current_balance: "42.00",
        include_net_worth: true,
      }),
    ],
  },
} as const;

function split(
  id: string,
  amount: string,
  currencyCode: string,
  decimalPlaces: number,
  extras: Record<string, unknown> = {},
) {
  return {
    transaction_journal_id: id,
    type: "withdrawal",
    date: "2026-03-08T07:30:00+00:00",
    currency_code: currencyCode,
    currency_decimal_places: decimalPlaces,
    primary_currency_code: "EUR",
    primary_currency_decimal_places: 2,
    amount,
    pc_amount: "123456789012345.67",
    foreign_currency_code: currencyCode === "EUR" ? "KWD" : null,
    foreign_currency_decimal_places: currencyCode === "EUR" ? 3 : null,
    foreign_amount: currencyCode === "EUR" ? "12.345" : null,
    pc_foreign_amount: null,
    source_id: "10",
    source_name: "Everyday account",
    source_type: "asset",
    destination_id: "30",
    destination_name: "Market",
    destination_type: "expense",
    reconciled: false,
    description:
      "A deliberately long fixture description to exercise wrapping and safe display without copying real financial data.",
    tags: ["fixture", "march-period"],
    ...extras,
  };
}

export const fixtureTransactionGroups = {
  data: [
    {
      type: "transactions",
      id: "700",
      attributes: {
        group_title: "March market purchase",
        transactions: [
          split("9001", "123456789012345.67", "EUR", 2),
          split("9002", "0.125", "KWD", 3, { reconciled: true }),
          split("9003", "42.00", "EUR", 2, {
            foreign_currency_code: null,
            foreign_currency_decimal_places: null,
            foreign_amount: null,
          }),
        ],
      },
    },
  ],
};

export const fixturePeriod = {
  start: "2026-03-01",
  end: "2026-03-31",
  time_zone: "America/Los_Angeles",
  currency_code: "EUR",
};

export const fixtureRecurrences = {
  data: [
    {
      type: "recurrences",
      id: "40",
      attributes: {
        type: "withdrawal",
        title: "Monthly rent",
        description: "Synthetic recurring transaction fixture.",
        first_date: "2026-01-01T00:00:00+00:00",
        latest_date: "2026-03-01T00:00:00+00:00",
        repeat_until: null,
        apply_rules: false,
        active: true,
        nr_of_repetitions: null,
        transactions: [],
      },
    },
  ],
};

export function makeLargeTransactionPage(size = 100) {
  if (!Number.isInteger(size) || size < 1 || size > 500) {
    throw new RangeError("Fixture page size must be between 1 and 500.");
  }
  return {
    data: Array.from({ length: size }, (_, index) => ({
      type: "transactions",
      id: String(10_000 + index),
      attributes: {
        group_title: `Synthetic large-page row ${index + 1}`,
        transactions: [
          split(String(20_000 + index), `${index + 1}.00`, "EUR", 2),
        ],
      },
    })),
    meta: { pagination: { total: size, current_page: 1, per_page: size } },
  };
}
