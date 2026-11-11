import assert from "node:assert/strict";
import test from "node:test";
import {
  budgetPayload,
  mapAvailableBudgets,
  mapBudgetLimits,
  mapBudgets,
  validateBudgetDraft,
  validateBudgetLimitDraft,
} from "../src/features/budgets/service.ts";

function draft(overrides = {}) {
  return {
    name: "Budget",
    active: true,
    order: "",
    notes: "",
    autoBudgetType: "none",
    autoBudgetAmount: "",
    autoBudgetPeriod: "",
    currencyCode: "EUR",
    ...overrides,
  };
}

test("budget mapping preserves auto-budget and spent currencies", () => {
  const budgets = mapBudgets({
    data: [
      {
        id: "1",
        attributes: {
          name: "Groceries",
          active: true,
          order: 2,
          auto_budget_type: "reset",
          auto_budget_amount: "100.00",
          auto_budget_period: "monthly",
          currency_code: "EUR",
          currency_decimal_places: 2,
          spent: [
            { sum: "12.50", currency_code: "EUR", currency_decimal_places: 2 },
          ],
        },
      },
      { id: "2", attributes: {} },
    ],
  });
  assert.equal(budgets.length, 1);
  assert.equal(budgets[0].autoBudgetType, "reset");
  assert.equal(budgets[0].spent[0].sum, "12.50");
});

test("budget validation requires auto amount/period only when configured", () => {
  assert.equal(validateBudgetDraft(draft()).ok, true);
  const bad = validateBudgetDraft(draft({ autoBudgetType: "reset" }));
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.autoBudgetAmount);
  assert.ok(bad.errors.autoBudgetPeriod);
  assert.equal(
    validateBudgetDraft(
      draft({
        autoBudgetType: "rollover",
        autoBudgetAmount: "10",
        autoBudgetPeriod: "monthly",
      }),
    ).ok,
    true,
  );
  assert.equal(validateBudgetDraft(draft({ name: "" })).ok, false);
});

test("budget payload includes auto-budget values only when enabled", () => {
  const none = budgetPayload(draft());
  assert.equal(none.auto_budget_amount, undefined);
  const reset = budgetPayload(
    draft({
      autoBudgetType: "reset",
      autoBudgetAmount: "10",
      autoBudgetPeriod: "monthly",
    }),
  );
  assert.equal(reset.auto_budget_amount, "10");
  assert.equal(reset.auto_budget_period, "monthly");
  assert.equal(reset.auto_budget_currency_code, "EUR");
});

test("limit mapping and validation enforce ordered positive periods", () => {
  const limits = mapBudgetLimits({
    data: [
      {
        id: "5",
        attributes: {
          budget_id: "1",
          start: "2026-01-01T00:00:00+00:00",
          end: "2026-01-31T23:59:59+00:00",
          amount: "100.00",
          currency_code: "EUR",
          currency_decimal_places: 2,
        },
      },
    ],
  });
  assert.equal(limits[0].id, "5");
  assert.equal(
    validateBudgetLimitDraft({
      start: "2026-01-01",
      end: "2026-01-31",
      amount: "10",
      currencyCode: "EUR",
    }).ok,
    true,
  );
  const bad = validateBudgetLimitDraft({
    start: "2026-02-01",
    end: "2026-01-01",
    amount: "-1",
    currencyCode: "",
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.end);
  assert.ok(bad.errors.amount);
  assert.ok(bad.errors.currencyCode);
});

test("available budgets remain read-only mapped records", () => {
  const available = mapAvailableBudgets({
    data: [
      {
        id: "7",
        attributes: {
          amount: "50.00",
          currency_code: "EUR",
          currency_decimal_places: 2,
          start: "2026-01-01",
          end: "2026-01-31",
          spent: [{ sum: "20.00" }],
        },
      },
    ],
  });
  assert.equal(available[0].amount, "50.00");
  assert.equal(available[0].spent, "20.00");
});
