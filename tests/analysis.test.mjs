import assert from "node:assert/strict";
import test from "node:test";
import {
  INSIGHT_OPTIONS,
  mapChart,
  mapInsights,
  mapSummary,
  rangeFromKey,
} from "../src/features/analysis/service.ts";

test("summary and chart mapping preserve currency precision", () => {
  const summary = mapSummary({
    balance: {
      value: "10.50",
      currency_code: "EUR",
      currency_decimal_places: 2,
    },
    ignored: "x",
  });
  assert.equal(summary.balance.value, "10.50");
  const chart = mapChart({
    data: [
      {
        label: "Jan",
        balance: "1.00",
        currency_code: "EUR",
        currency_decimal_places: 2,
      },
    ],
  });
  assert.equal(chart[0].label, "Jan");
  const insights = mapInsights({
    data: [
      {
        key: "x",
        title: "Food",
        monetary_value: "2.00",
        currency_code: "EUR",
        currency_decimal_places: 2,
      },
    ],
  });
  assert.equal(insights[0].value, "2.00");
});

test("all 26 insights are declared and ranges are deterministic", () => {
  assert.equal(INSIGHT_OPTIONS.length, 26);
  assert.equal(new Set(INSIGHT_OPTIONS.map((option) => option.value)).size, 26);
  for (const key of ["this-month", "last-30-days", "year-to-date", "all"]) {
    const range = rangeFromKey(key);
    assert.match(range.start, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(range.end, /^\d{4}-\d{2}-\d{2}$/);
  }
});
