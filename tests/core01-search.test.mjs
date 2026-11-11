import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTOCOMPLETE_FAMILIES,
  findAutocompleteFamily,
  mapAccountSearch,
  mapSearchResults,
  normalizeAutocomplete,
} from "../src/features/search/service.ts";

test("all fifteen autocomplete declarations are represented", () => {
  assert.equal(AUTOCOMPLETE_FAMILIES.length, 15);
  const ids = AUTOCOMPLETE_FAMILIES.map((family) => family.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const required of [
    "accounts",
    "bills",
    "subscriptions",
    "budgets",
    "categories",
    "currencies",
    "object-groups",
    "piggy-banks",
    "recurring",
    "rules",
    "rule-groups",
    "tags",
    "transactions",
    "transactions-with-meta",
    "transaction-types",
  ]) {
    assert.ok(ids.includes(required), `missing ${required}`);
  }
  assert.equal(
    findAutocompleteFamily("subscriptions")?.operation,
    "autocomplete.subscriptions",
  );
  assert.equal(findAutocompleteFamily("nope"), undefined);
});

test("autocomplete response normalization keeps IDs and labels", () => {
  assert.deepEqual(
    normalizeAutocomplete([
      { id: "1", name: "Bank", type: "asset", active: true },
      { id: "2", name_with_balance: "Cash (€5.00)" },
      { name: "No ID" },
      { id: "3" },
    ]),
    [
      { id: "1", label: "Bank", description: "asset" },
      { id: "2", label: "Cash (€5.00)" },
    ],
  );
  assert.deepEqual(normalizeAutocomplete({ data: [] }), []);
});

test("transaction search mapping keeps group and journal identities distinct", () => {
  const result = mapSearchResults({
    data: [
      {
        id: "100",
        attributes: {
          group_title: "Groceries",
          transactions: [
            {
              transaction_journal_id: "201",
              description: "Market",
              amount: "12.340000000000",
              currency_code: "EUR",
              currency_symbol: "€",
              currency_decimal_places: 2,
              date: "2026-01-15T00:00:00+00:00",
              type: "withdrawal",
              source_name: "Bank",
              destination_name: "Market",
              category_name: "Food",
              budget_name: "Monthly",
              reconciled: true,
              tags: ["weekly", 7],
            },
            {
              transaction_journal_id: "202",
              description: "Bag",
              amount: "1.00",
              currency_code: "EUR",
              currency_decimal_places: 2,
            },
          ],
        },
      },
      { attributes: {} },
    ],
    meta: {
      pagination: { current_page: 2, total_pages: 4, total: 77 },
    },
  });
  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].id, "100");
  assert.deepEqual(
    result.groups[0].journals.map((journal) => journal.journalId),
    ["201", "202"],
  );
  assert.equal(result.groups[0].journals[0].decimalPlaces, 2);
  assert.deepEqual(result.groups[0].journals[0].tags, ["weekly"]);
  assert.equal(result.page, 2);
  assert.equal(result.pageCount, 4);
  assert.equal(result.total, 77);
  assert.equal(result.count, 2);
});

test("search results default safely for empty or malformed payloads", () => {
  const result = mapSearchResults(null);
  assert.deepEqual(result.groups, []);
  assert.equal(result.page, 1);
  assert.equal(result.pageCount, 1);
  assert.equal(result.total, null);
  assert.equal(result.count, 0);
});

test("account search mapping preserves balance and active state", () => {
  const accounts = mapAccountSearch({
    data: [
      {
        id: "9",
        attributes: {
          name: "Savings",
          type: "asset",
          account_role: "savingAsset",
          active: false,
          currency_code: "EUR",
          currency_decimal_places: 2,
          current_balance: "50.00",
        },
      },
      { id: "10", attributes: {} },
    ],
  });
  assert.deepEqual(accounts, [
    {
      id: "9",
      name: "Savings",
      type: "asset",
      role: "savingAsset",
      active: false,
      currencyCode: "EUR",
      decimalPlaces: 2,
      currentBalance: "50.00",
    },
  ]);
});
