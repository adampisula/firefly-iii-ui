import assert from "node:assert/strict";
import test from "node:test";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  clampFrost,
  parseAppearance,
  parsePrivacy,
  resolveTheme,
  serializeAppearance,
} from "../src/lib/appearance.ts";
import {
  ALL_NAV_LINKS,
  BOTTOM_NAV_LINKS,
  NAV_GROUPS,
  findNavLinkByPath,
  findNavLinkBySegment,
} from "../src/lib/nav.ts";
import {
  DEFAULT_ACCOUNT_CHOICES,
  describeOnboardingError,
  mapAccounts,
  mapCurrencies,
  planAccountCreations,
  validateOnboardingInput,
} from "../src/features/onboarding/service.ts";
import { resolveOperationPath } from "../src/lib/api/operations.ts";

test("appearance parsing defaults and clamps stored values", () => {
  assert.deepEqual(parseAppearance(null), DEFAULT_APPEARANCE);
  assert.deepEqual(parseAppearance("not-json"), DEFAULT_APPEARANCE);
  assert.deepEqual(
    parseAppearance(
      JSON.stringify({ theme: "dark", frost: 7, reducedTransparency: true }),
    ),
    {
      ...DEFAULT_APPEARANCE,
      theme: "dark",
      frost: 1,
      reducedTransparency: true,
    },
  );
  assert.deepEqual(
    parseAppearance(
      JSON.stringify({ theme: "sepia", frost: -2, reducedTransparency: "yes" }),
    ),
    { ...DEFAULT_APPEARANCE, frost: 0 },
  );
  assert.equal(clampFrost(Number.NaN), 0.5);
  assert.equal(parsePrivacy("true"), true);
  assert.equal(parsePrivacy("false"), false);
  assert.equal(parsePrivacy(null), false);
});

test("appearance theme resolution follows system preference", () => {
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.match(
    serializeAppearance({
      ...DEFAULT_APPEARANCE,
      theme: "light",
      frost: 0.25,
    }),
    /"frost":0.25/,
  );
  assert.equal(APPEARANCE_STORAGE_KEY, "ff.appearance");
});

test("navigation manifest has unique links and honest planned states", () => {
  const ids = ALL_NAV_LINKS.map((link) => link.id);
  const hrefs = ALL_NAV_LINKS.map((link) => link.href);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(hrefs).size, hrefs.length);
  assert.ok(BOTTOM_NAV_LINKS.every((link) => ids.includes(link.id)));
  assert.ok(NAV_GROUPS.length >= 4);
  assert.equal(findNavLinkByPath("/")?.id, "overview");
  assert.equal(findNavLinkByPath("/transactions/42")?.id, "transactions");
  assert.equal(findNavLinkBySegment("accounts")?.task, "CORE-02");
  assert.equal(findNavLinkBySegment("unknown-section"), undefined);
  assert.equal(
    ALL_NAV_LINKS.filter((link) => link.status === "available").every((link) =>
      [
        "overview",
        "assistant",
        "settings",
        "help",
        "search",
        "accounts",
        "transactions",
        "link-types",
        "budgets",
        "subscriptions",
        "piggy-banks",
        "categories",
        "attachments",
        "insights",
        "rules",
        "recurrences",
        "webhooks",
        "export",
        "preferences",
        "maintenance",
        "currencies",
        "administration",
        "users",
        "reports",
        "notifications",
      ].includes(link.id),
    ),
    true,
  );
});

test("setup validation requires a currency and unique account names", () => {
  assert.equal(validateOnboardingInput(null).ok, false);
  assert.equal(
    validateOnboardingInput({ currencyCode: "EU", accounts: [] }).ok,
    false,
  );
  const duplicate = validateOnboardingInput({
    currencyCode: "eur",
    accounts: [
      { role: "defaultAsset", name: "Wallet" },
      { role: "savingAsset", name: "Wallet" },
      { role: "cashWalletAsset", name: "Cash" },
    ],
  });
  assert.equal(duplicate.ok, false);
  assert.ok(duplicate.errors.some((error) => error.includes("unique")));

  const valid = validateOnboardingInput({
    currencyCode: "eur",
    accounts: DEFAULT_ACCOUNT_CHOICES,
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.input?.currencyCode, "EUR");
});

test("account creation plan skips existing asset names on retry", () => {
  const existing = [
    {
      id: "1",
      name: "everyday account",
      type: "asset",
      role: "defaultAsset",
      currencyCode: "EUR",
    },
  ];
  const planned = planAccountCreations(existing, DEFAULT_ACCOUNT_CHOICES);
  assert.deepEqual(
    planned.map((choice) => choice.role),
    ["savingAsset", "cashWalletAsset"],
  );
  assert.equal(
    planAccountCreations(
      [
        ...existing,
        {
          id: "9",
          name: "Cash wallet",
          type: "expense",
          role: null,
          currencyCode: "EUR",
        },
      ],
      DEFAULT_ACCOUNT_CHOICES,
    ).length,
    2,
  );
});

test("JSON:API account and currency mapping ignores malformed rows", () => {
  const accounts = mapAccounts({
    data: [
      {
        id: "4",
        attributes: {
          name: "Bank",
          type: "asset",
          account_role: "defaultAsset",
          currency_code: "EUR",
        },
      },
      { attributes: { name: "No id", type: "asset" } },
      { id: "5", attributes: { name: "No type" } },
    ],
  });
  assert.equal(accounts.length, 1);
  assert.equal(accounts[0].id, "4");

  assert.deepEqual(
    mapAccounts({
      data: {
        id: "6",
        attributes: {
          name: "Created bank",
          type: "asset",
          account_role: "defaultAsset",
          currency_code: "EUR",
        },
      },
    }),
    [
      {
        id: "6",
        name: "Created bank",
        type: "asset",
        role: "defaultAsset",
        currencyCode: "EUR",
      },
    ],
  );

  const currencies = mapCurrencies({
    data: [
      {
        id: "1",
        attributes: {
          code: "KWD",
          name: "Kuwaiti Dinar",
          symbol: "KD",
          decimal_places: 3,
          enabled: true,
        },
      },
      { id: "2", attributes: { name: "Missing code" } },
    ],
  });
  assert.deepEqual(currencies, [
    {
      code: "KWD",
      name: "Kuwaiti Dinar",
      symbol: "KD",
      decimalPlaces: 3,
      enabled: true,
    },
  ]);
});

test("onboarding error messages stay actionable without backend detail", () => {
  assert.match(
    describeOnboardingError(new Error("boom")),
    /could not be completed/,
  );
  assert.equal(
    describeOnboardingError("boom"),
    "Setup could not be completed. Check the connection and try again.",
  );
});

test("allowlist covers existing API onboarding operations", () => {
  assert.equal(resolveOperationPath("accounts.store"), "accounts");
  assert.equal(
    resolveOperationPath("currencies.primary", { currencyCode: "eur" }),
    "currencies/EUR/primary",
  );
  assert.throws(
    () => resolveOperationPath("currencies.primary", { currencyCode: "EURO" }),
    /three-letter currency code/,
  );
  assert.equal(resolveOperationPath("preferences.store"), "preferences");
  assert.equal(resolveOperationPath("currencies.index"), "currencies");
});
