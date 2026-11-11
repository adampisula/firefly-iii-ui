import assert from "node:assert/strict";
import test from "node:test";
import {
  mapAttachments,
  mapJournalLinks,
  mapPiggyEvents,
  mapSingleGroup,
  mapTransactionList,
  transactionTypeLabel,
} from "../src/features/transactions/service.ts";

const groupResource = {
  id: "77",
  attributes: {
    group_title: "Split group",
    transactions: [
      {
        transaction_journal_id: "701",
        type: "withdrawal",
        date: "2026-01-15T00:00:00+00:00",
        order: 1,
        description: "First split",
        amount: "10.00",
        currency_code: "EUR",
        currency_symbol: "€",
        currency_decimal_places: 2,
        foreign_amount: "11.00",
        foreign_currency_code: "USD",
        foreign_currency_symbol: "$",
        foreign_currency_decimal_places: 2,
        source_id: "1",
        source_name: "Bank",
        source_type: "asset",
        destination_id: "2",
        destination_name: "Shop",
        destination_type: "expense",
        category_name: "Food",
        budget_name: "Monthly",
        bill_name: "Groceries",
        reconciled: true,
        notes: "note",
        tags: ["a", 2],
        internal_reference: "ref",
        external_id: "ext",
        original_source: "web",
        recurrence_id: "5",
        interest_date: "2026-01-01",
        book_date: null,
        latitude: 1.5,
        longitude: 2.5,
        zoom_level: 10,
      },
      {
        transaction_journal_id: "702",
        type: "withdrawal",
        date: "2026-01-15T00:00:00+00:00",
        order: 2,
        description: "Second split",
        amount: "5.00",
        currency_code: "EUR",
        currency_decimal_places: 0,
      },
    ],
  },
};

test("transaction list mapping preserves group and journal IDs", () => {
  const list = mapTransactionList({
    data: [groupResource],
    meta: { pagination: { current_page: 1, total_pages: 3, total: 40 } },
  });
  assert.equal(list.groups.length, 1);
  assert.equal(list.groups[0].id, "77");
  assert.deepEqual(
    list.groups[0].journals.map((journal) => journal.journalId),
    ["701", "702"],
  );
  assert.equal(list.groups[0].journals[0].foreignAmount, "11.00");
  assert.equal(list.groups[0].journals[0].foreignCurrencyCode, "USD");
  assert.deepEqual(list.groups[0].journals[0].tags, ["a"]);
  assert.equal(list.groups[0].journals[0].reconciled, true);
  assert.equal(list.groups[0].journals[1].decimalPlaces, 0);
  assert.equal(list.pageCount, 3);
  assert.equal(list.total, 40);
});

test("single group mapping and malformed fallbacks are safe", () => {
  assert.equal(mapSingleGroup({ data: groupResource })?.title, "Split group");
  assert.equal(mapSingleGroup({ data: null }), null);
  const empty = mapTransactionList({});
  assert.deepEqual(empty.groups, []);
  assert.equal(empty.page, 1);
  assert.equal(empty.pageCount, 1);
  assert.equal(empty.total, null);
});

test("attachments, piggy events and journal links map defensively", () => {
  assert.deepEqual(
    mapAttachments({
      data: [
        {
          id: "3",
          attributes: {
            title: "Receipt",
            filename: "r.pdf",
            mime: "application/pdf",
            size: 12,
            notes: "copy",
          },
        },
        { id: "4", attributes: {} },
      ],
    }),
    [
      {
        id: "3",
        title: "Receipt",
        filename: "r.pdf",
        mime: "application/pdf",
        size: 12,
        notes: "copy",
      },
    ],
  );
  assert.deepEqual(
    mapPiggyEvents({
      data: [
        {
          id: "5",
          attributes: {
            piggy_bank_id: "9",
            name: "Holiday",
            amount: "20.00",
            date: "2026-01-01",
            transaction_journal_id: "701",
          },
        },
      ],
    }),
    [
      {
        id: "5",
        piggyBankId: "9",
        piggyBankName: "Holiday",
        amount: "20.00",
        date: "2026-01-01",
        journalId: "701",
      },
    ],
  );
  assert.deepEqual(
    mapJournalLinks({
      data: [
        {
          id: "6",
          attributes: {
            inward_id: "1",
            outward_id: "2",
            link_type_id: "4",
            notes: "link",
          },
        },
      ],
    }),
    [
      {
        id: "6",
        inwardId: "1",
        outwardId: "2",
        linkTypeId: "4",
        notes: "link",
      },
    ],
  );
});

test("transaction type labels remain English", () => {
  assert.equal(transactionTypeLabel("withdrawal"), "Withdrawals");
  assert.equal(transactionTypeLabel("unknown"), "unknown");
});
