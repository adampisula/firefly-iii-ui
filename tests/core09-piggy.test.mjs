import assert from "node:assert/strict";
import test from "node:test";
import {
  mapPiggyBanks,
  mapPiggyEvents,
  piggyPayload,
  validatePiggyDraft,
} from "../src/features/piggy-banks/service.ts";

function draft(overrides = {}) {
  return {
    name: "Holiday",
    targetAmount: "1000",
    startDate: "2026-01-01",
    targetDate: "",
    order: "",
    notes: "",
    objectGroupTitle: "",
    accountId: "1",
    currentAmount: "0",
    ...overrides,
  };
}

test("piggy mapping keeps multi-account allocations and events", () => {
  const pigs = mapPiggyBanks({
    data: [
      {
        id: "1",
        attributes: {
          name: "Holiday",
          target_amount: "1000.00",
          current_amount: "250.00",
          percentage: 25,
          start_date: "2026-01-01",
          accounts: [
            {
              id: "2",
              name: "Bank",
              current_amount: "200.00",
              currency_code: "EUR",
              currency_decimal_places: 2,
            },
            {
              id: "3",
              name: "Cash",
              current_amount: "50.00",
              currency_code: "EUR",
              currency_decimal_places: 2,
            },
          ],
        },
      },
    ],
  });
  assert.equal(pigs[0].accounts.length, 2);
  assert.equal(pigs[0].percentage, 25);
  assert.equal(
    mapPiggyEvents({
      data: [
        {
          id: "9",
          attributes: {
            amount: "10.00",
            date: "2026-01-02",
            transaction_journal_id: "5",
          },
        },
      ],
    })[0].journalId,
    "5",
  );
});

test("piggy validation enforces target, dates, account and reserved amount", () => {
  assert.equal(validatePiggyDraft(draft()).ok, true);
  const bad = validatePiggyDraft(
    draft({
      name: "",
      targetAmount: "-1",
      startDate: "bad",
      targetDate: "bad",
      accountId: "",
      currentAmount: "-1",
    }),
  );
  assert.equal(bad.ok, false);
  for (const key of [
    "name",
    "targetAmount",
    "startDate",
    "targetDate",
    "accountId",
    "currentAmount",
  ])
    assert.ok(bad.errors[key]);
  assert.equal(
    validatePiggyDraft(draft({ targetDate: "2025-01-01" })).ok,
    false,
  );
});

test("piggy payload preserves other account allocations", () => {
  const payload = piggyPayload(
    draft({ accountId: "2", currentAmount: "150", targetDate: "2026-12-31" }),
    [
      {
        accountId: "2",
        name: "Bank",
        currentAmount: "100",
        currencyCode: "EUR",
        decimalPlaces: 2,
      },
      {
        accountId: "3",
        name: "Cash",
        currentAmount: "50",
        currencyCode: "EUR",
        decimalPlaces: 2,
      },
    ],
  );
  assert.equal(payload.target_amount, "1000");
  assert.equal(payload.target_date, "2026-12-31");
  assert.deepEqual(payload.accounts, [
    { account_id: "3", current_amount: "50" },
    { account_id: "2", current_amount: "150" },
  ]);
});
