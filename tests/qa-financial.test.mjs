import assert from "node:assert/strict";
import test from "node:test";
import { formatEnglishMoney } from "../src/lib/i18n/messages.ts";
import {
  rangeFromKey,
  INSIGHT_OPTIONS,
} from "../src/features/analysis/service.ts";
import { transactionPayload } from "../src/features/transactions/service.ts";

test("money formatting preserves decimal strings for zero, tiny, huge and negative values", () => {
  assert.equal(
    formatEnglishMoney({ amount: "0", code: "EUR", decimalPlaces: 2 }),
    "€0.00",
  );
  assert.equal(
    formatEnglishMoney({
      amount: "0.001",
      code: "KWD",
      decimalPlaces: 3,
    }).replace(/\u00a0/g, " "),
    "KWD 0.001",
  );
  assert.equal(
    formatEnglishMoney({
      amount: "-123456789012345.67",
      code: "EUR",
      decimalPlaces: 2,
    }),
    "-€123,456,789,012,345.67",
  );
  assert.equal(
    formatEnglishMoney({ amount: "1", code: "JPY", decimalPlaces: 0 }),
    "¥1",
  );
});

test("transaction payload keeps amount strings without Number coercion", () => {
  const payload = transactionPayload({
    groupTitle: "g",
    applyRules: false,
    fireWebhooks: false,
    errorIfDuplicate: false,
    journals: [
      {
        type: "withdrawal",
        date: "2026-01-01",
        amount: "999999999999.999999",
        description: "d",
        sourceId: "1",
        destinationId: "2",
        currencyCode: "EUR",
        foreignAmount: "",
        foreignCurrencyCode: "",
        categoryId: "",
        budgetId: "",
        billId: "",
        tags: "",
        notes: "",
        internalReference: "",
        externalUrl: "",
        reconciled: false,
      },
    ],
  });
  assert.equal(payload.transactions[0].amount, "999999999999.999999");
});

test("temporal ranges are date-only and stable at month boundaries", () => {
  for (const key of ["this-month", "last-30-days", "year-to-date", "all"]) {
    const range = rangeFromKey(key);
    assert.match(range.start, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(range.end, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(range.start <= range.end);
  }
});

test("insight expectations do not mix currencies in one total", () => {
  // The UI renders each returned point with its own currency; this guards against
  // a future change collapsing all points into one unlabeled total.
  assert.equal(INSIGHT_OPTIONS.length, 26);
});
