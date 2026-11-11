import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCloneTransactions,
  buildConversion,
  linksForJournal,
  mapLinkTypes,
  mapTransactionLinks,
} from "../src/features/transaction-actions/service.ts";

function group(overrides = {}) {
  return {
    id: "10",
    title: "Group",
    journals: [
      {
        journalId: "11",
        type: "withdrawal",
        date: "2026-01-01T00:00:00+00:00",
        amount: "10.00",
        description: "Split",
        sourceId: "1",
        sourceName: "Bank",
        sourceType: "asset",
        destinationId: "2",
        destinationName: "Shop",
        destinationType: "expense",
        currencyCode: "EUR",
        foreignAmount: "11.00",
        foreignCurrencyCode: "USD",
        categoryId: null,
        budgetId: null,
        billId: null,
        tags: ["a"],
        notes: "note",
        internalReference: "ref",
        reconciled: false,
      },
    ],
    ...overrides,
  };
}

test("link type and link mapping preserve directions and notes", () => {
  assert.deepEqual(
    mapLinkTypes({
      data: [
        {
          id: "1",
          attributes: {
            name: "Related",
            inward: "is related to",
            outward: "relates to",
          },
        },
        { id: "2", attributes: {} },
      ],
    }),
    [
      {
        id: "1",
        name: "Related",
        inward: "is related to",
        outward: "relates to",
      },
    ],
  );
  assert.deepEqual(
    mapTransactionLinks({
      data: [
        {
          id: "9",
          attributes: {
            inward_id: "11",
            outward_id: "22",
            link_type_id: "1",
            notes: "note",
          },
        },
      ],
    }),
    [
      {
        id: "9",
        inwardId: "11",
        outwardId: "22",
        linkTypeId: "1",
        notes: "note",
      },
    ],
  );
  assert.equal(
    linksForJournal(mapTransactionLinks({ data: [] }), "11").length,
    0,
  );
});

test("clone strips journal identity, reconciled state and creation metadata", () => {
  const cloned = buildCloneTransactions(group());
  assert.equal(cloned.length, 1);
  assert.equal("transaction_journal_id" in cloned[0], false);
  assert.equal("reconciled" in cloned[0], false);
  assert.equal("created_at" in cloned[0], false);
  assert.equal(cloned[0].date, "2026-01-01");
  assert.equal(cloned[0].description, "Split");
});

test("withdrawal/deposit conversion swaps accounts and keeps journal IDs", () => {
  const result = buildConversion(group(), "deposit");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.transactions[0].type, "deposit");
  assert.equal(result.transactions[0].source_id, "2");
  assert.equal(result.transactions[0].destination_id, "1");
  assert.equal(result.transactions[0].transaction_journal_id, "11");
});

test("conversion rejects reconciled and unsafe transfer targets", () => {
  const reconciled = buildConversion(
    group({ journals: [{ ...group().journals[0], reconciled: true }] }),
    "deposit",
  );
  assert.equal(reconciled.ok, false);

  const unsafe = buildConversion(group(), "transfer");
  assert.equal(unsafe.ok, false);

  const safeTransfer = buildConversion(
    group({
      journals: [
        {
          ...group().journals[0],
          destinationType: "asset",
          type: "transfer",
        },
      ],
    }),
    "transfer",
  );
  assert.equal(safeTransfer.ok, true);
});
