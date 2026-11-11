import assert from "node:assert/strict";
import test from "node:test";
import {
  transactionPayload,
  validateTransactionDraft,
} from "../src/features/transactions/service.ts";
import { draftFromForm } from "../src/features/transactions/form-data.ts";

function journal(overrides = {}) {
  return {
    journalId: undefined,
    type: "withdrawal",
    date: "2026-01-01",
    amount: "10.00",
    description: "Test",
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
    ...overrides,
  };
}

function draft(overrides = {}) {
  return {
    groupTitle: "Group",
    applyRules: true,
    fireWebhooks: false,
    errorIfDuplicate: false,
    journals: [journal()],
    ...overrides,
  };
}

test("transaction draft validates required fields and positive amounts", () => {
  assert.equal(validateTransactionDraft(draft()).ok, true);
  const bad = validateTransactionDraft(
    draft({
      journals: [
        journal({
          amount: "-1",
          description: "",
          date: "bad",
          sourceId: "",
          destinationId: "",
        }),
      ],
    }),
  );
  assert.equal(bad.ok, false);
  assert.ok(bad.errors["transactions.0.amount"]);
  assert.ok(bad.errors["transactions.0.description"]);
  assert.ok(bad.errors["transactions.0.date"]);
  assert.ok(bad.errors["transactions.0.source_id"]);
});

test("transfers reject identical accounts", () => {
  const result = validateTransactionDraft(
    draft({ journals: [journal({ type: "transfer", destinationId: "1" })] }),
  );
  assert.equal(result.ok, false);
  assert.match(
    result.errors["transactions.0.destination_id"],
    /different accounts/,
  );
});

test("foreign amounts require both amount and currency", () => {
  assert.equal(
    validateTransactionDraft(
      draft({ journals: [journal({ foreignAmount: "5" })] }),
    ).ok,
    false,
  );
  assert.equal(
    validateTransactionDraft(
      draft({
        journals: [journal({ foreignAmount: "5", foreignCurrencyCode: "USD" })],
      }),
    ).ok,
    true,
  );
});

test("payload retains every split journal identity and optional fields", () => {
  const payload = transactionPayload(
    draft({
      groupTitle: "My group",
      applyRules: false,
      fireWebhooks: true,
      journals: [
        journal({ journalId: "11", amount: "1.00", tags: "a, b", notes: "n" }),
        journal({
          journalId: "12",
          amount: "2.00",
          foreignAmount: "3",
          foreignCurrencyCode: "USD",
        }),
      ],
    }),
  );
  assert.equal(payload.group_title, "My group");
  assert.equal(payload.apply_rules, false);
  assert.equal(payload.fire_webhooks, true);
  assert.equal(payload.transactions.length, 2);
  assert.equal(payload.transactions[0].transaction_journal_id, "11");
  assert.equal(payload.transactions[1].transaction_journal_id, "12");
  assert.deepEqual(payload.transactions[0].tags, ["a", "b"]);
  assert.equal(payload.transactions[1].foreign_currency_code, "USD");
});

test("form parsing reads indexed split fields", () => {
  const form = new FormData();
  form.set("group_title", "Group");
  form.set("journal_count", "2");
  form.set("journal_0_type", "withdrawal");
  form.set("journal_0_date", "2026-01-02");
  form.set("journal_0_amount", "3.00");
  form.set("journal_0_description", "One");
  form.set("journal_0_source_id", "1");
  form.set("journal_0_destination_id", "2");
  form.set("journal_0_currency_code", "EUR");
  form.set("journal_0_journal_id", "55");
  form.set("journal_0_reconciled", "true");
  form.set("journal_1_type", "deposit");
  form.set("journal_1_date", "2026-01-03");
  form.set("journal_1_amount", "4.00");
  form.set("journal_1_description", "Two");
  form.set("journal_1_source_id", "2");
  form.set("journal_1_destination_id", "1");
  form.set("journal_1_currency_code", "EUR");
  const draftValue = draftFromForm(form);
  assert.equal(draftValue.journals.length, 2);
  assert.equal(draftValue.journals[0].journalId, "55");
  assert.equal(draftValue.journals[0].reconciled, true);
  assert.equal(draftValue.journals[1].type, "deposit");
});
