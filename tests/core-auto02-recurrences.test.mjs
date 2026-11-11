import assert from "node:assert/strict";
import test from "node:test";
import {
  mapRecurrences,
  recurrencePayload,
  validateRecurrenceDraft,
} from "../src/features/recurrences/service.ts";

function draft(overrides = {}) {
  return {
    type: "withdrawal",
    title: "Rent",
    description: "",
    firstDate: "2026-01-01",
    repeatUntil: "",
    nrOfRepetitions: "",
    applyRules: true,
    active: true,
    notes: "",
    repType: "monthly",
    repMoment: "",
    repSkip: "0",
    descriptionTx: "Rent payment",
    amount: "100",
    sourceId: "1",
    destinationId: "2",
    currencyCode: "EUR",
    ...overrides,
  };
}

test("recurrence mapping keeps repetitions, transactions and latest date", () => {
  const rows = mapRecurrences({
    data: [
      {
        id: "1",
        attributes: {
          title: "Rent",
          type: "withdrawal",
          first_date: "2026-01-01T00:00:00+00:00",
          latest_date: "2026-03-01T00:00:00+00:00",
          repetitions: [{ type: "monthly", moment: "", skip: 0 }],
          transactions: [
            {
              description: "Rent",
              amount: "100",
              source_id: "1",
              destination_id: "2",
              currency_code: "EUR",
            },
          ],
        },
      },
    ],
  });
  assert.equal(rows[0].latestDate?.slice(0, 10), "2026-03-01");
  assert.equal(rows[0].repetitions[0].type, "monthly");
  assert.equal(rows[0].transactions[0].amount, "100");
});

test("recurrence validation and payload are complete", () => {
  assert.equal(validateRecurrenceDraft(draft()).ok, true);
  const bad = validateRecurrenceDraft(
    draft({
      title: "",
      firstDate: "bad",
      repType: "bogus",
      descriptionTx: "",
      amount: "0",
      sourceId: "",
      destinationId: "",
      currencyCode: "",
    }),
  );
  assert.equal(bad.ok, false);
  for (const key of [
    "title",
    "firstDate",
    "repType",
    "descriptionTx",
    "amount",
    "sourceId",
    "currencyCode",
  ])
    assert.ok(bad.errors[key]);
  const payload = recurrencePayload(
    draft({ nrOfRepetitions: "3", repeatUntil: "2026-12-31" }),
  );
  assert.equal(payload.nr_of_repetitions, 3);
  assert.equal(payload.repeat_until, "2026-12-31");
  assert.equal(payload.repetitions.length, 1);
  assert.equal(payload.transactions.length, 1);
});
