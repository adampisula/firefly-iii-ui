import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  parseCsv,
  validateInventory,
  validatePlans,
  validateVersion,
} from "../scripts/validate-plans.mjs";

const schema = JSON.parse(
  await readFile(
    new URL("../plans/inventory/schema.json", import.meta.url),
    "utf8",
  ),
);
const tasks = new Set([
  "FND-01",
  "FND-02",
  "FND-03",
  "FND-04",
  "FND-05",
  "FND-06",
  "FND-07",
  "FND-08",
  "FND-08-a",
  "FND-08-b",
  "FND-09",
  "FND-10",
  "FND-11",
  "SYS-01",
]);

function apiRow(overrides = {}) {
  return {
    operation_id: "api.v1.accounts.index",
    method: "GET",
    path: "/api/v1/accounts",
    family: "accounts",
    task_id: "SYS-01",
    source: "firefly/firefly-iii/routes/api.php",
    source_line: "65",
    controller: "AccountsController",
    action: "index",
    controller_source: "firefly/firefly-iii/AccountsController.php",
    controller_line: "12",
    permission_notes: "",
    alias_of: "",
    notes: "",
    status: "planned",
    verification: "static_not_runtime_verified",
    screen_or_client: "",
    test_references: "",
    evidence: "Static source only; runtime not verified.",
    disposition: "requires_contract_verification",
    disposition_reason: "Runtime verification remains required.",
    ...overrides,
  };
}

function apiInventory(rows) {
  return { headers: schema.inventories.api.headers, rows };
}

test("CSV parser retains quoted commas, embedded newlines, and escaped quotes", () => {
  const parsed = parseCsv('id,notes\na,"comma, line\nand ""quoted"" text"\n');
  assert.deepEqual(parsed.rows, [
    { id: "a", notes: 'comma, line\nand "quoted" text' },
  ]);
});

test("planning ledger validates without promoting planned inventory rows", () => {
  const result = validatePlans();
  assert.deepEqual(result.errors, []);
  assert.equal(result.counts.api, 247);
  assert.equal(result.counts.ui, 119);
});

test("duplicate API IDs and unmapped owners fail validation", () => {
  const errors = validateInventory(
    "api",
    apiInventory([apiRow(), apiRow()]),
    schema,
    tasks,
  );
  assert.ok(errors.some((error) => error.includes("duplicate operation_id")));
  assert.ok(errors.some((error) => error.includes("duplicate method/path")));
  const ownerErrors = validateInventory(
    "api",
    apiInventory([apiRow({ task_id: "MISSING-01" })]),
    schema,
    tasks,
  );
  assert.ok(ownerErrors.some((error) => error.includes("unmapped task owner")));
});

test("missing schema columns and unverified rows cannot be promoted to verified", () => {
  const malformed = {
    headers: schema.inventories.api.headers.slice(1),
    rows: [apiRow()],
  };
  assert.ok(
    validateInventory("api", malformed, schema, tasks).some((error) =>
      error.includes("columns/order"),
    ),
  );
  const errors = validateInventory(
    "api",
    apiInventory([apiRow({ status: "verified" })]),
    schema,
    tasks,
  );
  assert.ok(errors.some((error) => error.includes("static-only evidence")));
});

test("stale backend prefixes fail the coupled package/manifest contract", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  const compatibility = JSON.parse(
    await readFile(
      new URL("../backend-compatibility.json", import.meta.url),
      "utf8",
    ),
  );
  assert.ok(
    validateVersion(
      { ...packageJson, version: "6.7.8-frontend.0.1.0" },
      compatibility,
    ).length > 0,
  );
  assert.ok(
    validateVersion(packageJson, {
      ...compatibility,
      backend: { ...compatibility.backend, supportedVersion: "6.7.8" },
    }).length > 0,
  );
});
