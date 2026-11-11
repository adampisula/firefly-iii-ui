import assert from "node:assert/strict";
import test from "node:test";
import {
  accountPayload,
  accountTypeLabel,
  mapAccountList,
  mapSingleAccount,
  validateAccountDraft,
} from "../src/features/accounts/service.ts";

function draft(overrides = {}) {
  return {
    name: "Bank",
    type: "asset",
    accountRole: "defaultAsset",
    currencyCode: "EUR",
    active: true,
    includeNetWorth: true,
    openingBalance: "",
    openingBalanceDate: "",
    virtualBalance: "",
    iban: "",
    bic: "",
    accountNumber: "",
    notes: "",
    creditCardType: "",
    monthlyPaymentDate: "",
    liabilityType: "",
    liabilityDirection: "",
    liabilityAmount: "",
    liabilityStartDate: "",
    interest: "",
    interestPeriod: "",
    ...overrides,
  };
}

test("asset accounts require a supported role", () => {
  assert.equal(validateAccountDraft(draft()).ok, true);
  const invalid = validateAccountDraft(draft({ accountRole: "nope" }));
  assert.equal(invalid.ok, false);
  assert.match(invalid.errors.accountRole, /asset role/);
});

test("credit cards and liabilities enforce conditional fields", () => {
  const creditCard = validateAccountDraft(
    draft({
      accountRole: "ccAsset",
      creditCardType: "",
      monthlyPaymentDate: "",
    }),
  );
  assert.equal(creditCard.ok, false);
  assert.ok(creditCard.errors.creditCardType);
  assert.ok(creditCard.errors.monthlyPaymentDate);

  const liability = validateAccountDraft(
    draft({
      type: "liability",
      liabilityType: "",
      liabilityDirection: "",
      interest: "101",
      interestPeriod: "",
    }),
  );
  assert.equal(liability.ok, false);
  assert.ok(liability.errors.liabilityType);
  assert.ok(liability.errors.liabilityDirection);
  assert.ok(liability.errors.interest);
  assert.ok(liability.errors.interestPeriod);
});

test("opening balance and date must be provided together", () => {
  assert.equal(
    validateAccountDraft(draft({ openingBalance: "10.00" })).ok,
    false,
  );
  assert.equal(
    validateAccountDraft(draft({ openingBalanceDate: "2026-01-01" })).ok,
    false,
  );
  assert.equal(
    validateAccountDraft(
      draft({ openingBalance: "10.00", openingBalanceDate: "2026-01-01" }),
    ).ok,
    true,
  );
  assert.equal(
    validateAccountDraft(
      draft({
        liabilityAmount: "100",
        liabilityStartDate: "",
        type: "liability",
        liabilityType: "loan",
        liabilityDirection: "debit",
        interest: "5",
        interestPeriod: "monthly",
      }),
    ).ok,
    false,
  );
});

test("payload includes only conditional fields for the account type", () => {
  const asset = accountPayload(
    draft({ notes: "Hi", iban: "DE89370400440532013000" }),
  );
  assert.equal(asset.account_role, "defaultAsset");
  assert.equal(asset.liability_type, undefined);
  assert.equal(asset.credit_card_type, undefined);
  assert.equal(asset.notes, "Hi");

  const expense = accountPayload(
    draft({ type: "expense", accountRole: "defaultAsset" }),
  );
  assert.equal(expense.account_role, undefined);

  const liability = accountPayload(
    draft({
      type: "liability",
      liabilityType: "loan",
      liabilityDirection: "debit",
      interest: "4.5",
      interestPeriod: "yearly",
    }),
  );
  assert.equal(liability.liability_type, "loan");
  assert.equal(liability.liability_direction, "debit");
  assert.equal(liability.interest, "4.5");
});

test("account list and detail mapping preserve balances and metadata", () => {
  const payload = {
    data: [
      {
        id: "3",
        attributes: {
          name: "Bank",
          type: "asset",
          account_role: "defaultAsset",
          current_balance: "12.50",
          currency_code: "EUR",
          currency_symbol: "€",
          currency_decimal_places: 2,
          active: true,
          include_net_worth: true,
          opening_balance: "0",
          opening_balance_date: "2026-01-01T00:00:00+00:00",
          notes: "hello",
        },
      },
    ],
    meta: { pagination: { current_page: 1, total_pages: 2, total: 4 } },
  };
  const list = mapAccountList(payload);
  assert.equal(list.accounts.length, 1);
  assert.equal(list.accounts[0].currentBalance, "12.50");
  assert.equal(list.accounts[0].includeNetWorth, true);
  assert.equal(list.pageCount, 2);
  assert.equal(list.total, 4);
  assert.equal(mapSingleAccount({ data: payload.data[0] })?.id, "3");
  assert.equal(
    accountTypeLabel("asset", "ccAsset"),
    "Asset / Credit card asset",
  );
});
