import assert from "node:assert/strict";
import test from "node:test";
import {
  fixtureAbout,
  fixtureAccountsByUser,
  fixturePeriod,
  fixtureRecurrences,
  fixtureTransactionGroups,
  fixtureUsers,
  makeLargeTransactionPage,
} from "./fixtures/firefly.ts";

test("Firefly fixture variants include role, blocked, and private-account states", () => {
  assert.deepEqual(
    fixtureUsers.map(({ role }) => role),
    ["owner", "demo", "demo"],
  );
  assert.equal(fixtureUsers[2].blocked, true);
  assert.equal(fixtureAbout.data.version, "6.7.9");
  assert.equal(fixtureAbout.data.api_version, "v1");
  assert.notEqual(fixtureAccountsByUser.owner, fixtureAccountsByUser.demo);
  assert.equal(
    fixtureAccountsByUser.owner.data[1].attributes.liability_type,
    "loan",
  );
  assert.equal(fixtureAccountsByUser.owner.data[2].attributes.active, false);
});

test("transaction fixtures retain split IDs and native, foreign, primary, and reconciled fields", () => {
  const transactions = fixtureTransactionGroups.data[0].attributes.transactions;
  assert.deepEqual(
    transactions.map(({ transaction_journal_id }) => transaction_journal_id),
    ["9001", "9002", "9003"],
  );
  assert.equal(transactions[1].amount, "0.125");
  assert.equal(transactions[1].currency_decimal_places, 3);
  assert.equal(transactions[1].reconciled, true);
  assert.equal(transactions[0].foreign_amount, "12.345");
  assert.equal(transactions[0].pc_amount, "123456789012345.67");
  assert.equal(fixturePeriod.start, "2026-03-01");
  assert.equal(fixturePeriod.end, "2026-03-31");
  assert.equal(fixturePeriod.time_zone, "America/Los_Angeles");
});

test("automation and large-page fixtures are deterministic and bounded", () => {
  assert.equal(fixtureRecurrences.data[0].attributes.apply_rules, false);
  assert.equal(fixtureRecurrences.data[0].attributes.active, true);
  const first = makeLargeTransactionPage(100);
  const second = makeLargeTransactionPage(100);
  assert.deepEqual(first, second);
  assert.equal(first.data.length, 100);
  assert.throws(() => makeLargeTransactionPage(501), /between 1 and 500/);
});
