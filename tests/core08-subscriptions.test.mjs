import assert from "node:assert/strict";
import test from "node:test";
import {
  billGroupLabel,
  billPayload,
  mapBillAttachments,
  mapBillRules,
  mapBills,
  validateBillDraft,
} from "../src/features/subscriptions/service.ts";

function draft(overrides = {}) {
  return {
    name: "Netflix",
    amountMin: "5",
    amountMax: "10",
    currencyCode: "EUR",
    date: "2026-01-01",
    endDate: "",
    extensionDate: "",
    repeatFreq: "monthly",
    skip: "0",
    active: true,
    notes: "",
    objectGroupTitle: "",
    ...overrides,
  };
}

test("bill mapping keeps ranges, timeline and grouping", () => {
  const bills = mapBills({
    data: [
      {
        id: "1",
        attributes: {
          name: "Netflix",
          amount_min: "5.00",
          amount_max: "10.00",
          amount_avg: "7.00",
          currency_code: "EUR",
          currency_decimal_places: 2,
          date: "2026-01-01T00:00:00+00:00",
          repeat_freq: "monthly",
          skip: 0,
          active: true,
          object_group_title: "Media",
          pay_dates: ["2026-01-01", "2026-02-01"],
          next_expected_match: "2026-02-01T00:00:00+00:00",
        },
      },
    ],
  });
  assert.equal(bills[0].amountAvg, "7.00");
  assert.equal(bills[0].payDates.length, 2);
  assert.equal(billGroupLabel(bills[0]), "Media");
});

test("bill validation enforces range and repeat frequency", () => {
  assert.equal(validateBillDraft(draft()).ok, true);
  const bad = validateBillDraft(
    draft({ amountMin: "20", amountMax: "10", repeatFreq: "daily" }),
  );
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.amountMax);
  assert.ok(bad.errors.repeatFreq);
  assert.equal(validateBillDraft(draft({ name: "" })).ok, false);
  assert.equal(validateBillDraft(draft({ skip: "x" })).ok, false);
});

test("bill payload omits empty optional dates and notes", () => {
  const payload = billPayload(draft());
  assert.equal(payload.end_date, undefined);
  assert.equal(payload.extension_date, undefined);
  assert.equal(payload.notes, undefined);
  assert.equal(payload.repeat_freq, "monthly");
  const withDates = billPayload(
    draft({ endDate: "2026-12-31", notes: "note", objectGroupTitle: "Media" }),
  );
  assert.equal(withDates.end_date, "2026-12-31");
  assert.equal(withDates.notes, "note");
  assert.equal(withDates.object_group_title, "Media");
});

test("rule and attachment mapping ignore malformed rows", () => {
  assert.deepEqual(
    mapBillRules({
      data: [
        { id: "1", attributes: { title: "Rule", active: true } },
        { id: "2", attributes: {} },
      ],
    }),
    [{ id: "1", title: "Rule", active: true }],
  );
  assert.deepEqual(
    mapBillAttachments({
      data: [
        {
          id: "3",
          attributes: {
            title: "File",
            filename: "f.pdf",
            mime: "application/pdf",
            size: 2,
          },
        },
      ],
    })[0].filename,
    "f.pdf",
  );
});
