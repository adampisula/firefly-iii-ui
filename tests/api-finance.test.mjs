import assert from "node:assert/strict";
import test from "node:test";
import {
  assertFinancialCompatibility,
  isCompatibilityCurrent,
  normalizeApiBase,
  SUPPORTED_BACKEND_VERSION,
  verifyBackendCompatibility,
} from "../src/lib/api/compatibility.ts";
import { ApiClientError, createApiClient } from "../src/lib/api/client.ts";
import { safePaginationQuery } from "../src/lib/api/pagination.ts";
import { resolveOperationPath } from "../src/lib/api/operations.ts";
import {
  apiQueryKey,
  invalidatedDomainsForMutation,
} from "../src/lib/api/query-policy.ts";
import {
  decimalToUnits,
  formatMoney,
  normalizeDecimal,
  parseLocalizedDecimal,
  sumMoney,
  unitsToDecimal,
} from "../src/lib/finance/decimal.ts";
import {
  transactionGroupId,
  transactionIdentity,
  transactionJournalId,
} from "../src/lib/finance/transactions.ts";
import {
  dateOnlyInTimeZone,
  fiscalYearRange,
  formatDateOnly,
  formatTimestamp,
  validateInclusiveDateRange,
} from "../src/lib/finance/dates.ts";

const apiBase = "http://firefly:8080/api/v1";
const identity = "session-a";

function verifiedState(
  checkedAt = Date.now(),
  backend = apiBase,
  session = identity,
) {
  return {
    status: "verified",
    sessionIdentity: session,
    backendApiBase: backend,
    backendVersion: "6.7.9",
    checkedAt,
  };
}

async function withEnvironment(callback) {
  const original = {
    FRONTEND_PUBLIC_URL: process.env.FRONTEND_PUBLIC_URL,
    BACKEND_PUBLIC_URL: process.env.BACKEND_PUBLIC_URL,
    BACKEND_INTERNAL_API_URL: process.env.BACKEND_INTERNAL_API_URL,
  };
  Object.assign(process.env, {
    FRONTEND_PUBLIC_URL: "https://app.example.test",
    BACKEND_PUBLIC_URL: "https://firefly.example.test",
    BACKEND_INTERNAL_API_URL: apiBase,
  });
  try {
    return await callback();
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("the exact version gate reads data.version, not api_version", async () => {
  const verified = await verifyBackendCompatibility(
    async () => ({
      data: { version: SUPPORTED_BACKEND_VERSION, api_version: "different" },
    }),
    identity,
    apiBase,
  );
  assert.equal(verified.status, "verified");

  const legacyOnly = await verifyBackendCompatibility(
    async () => ({ data: { api_version: SUPPORTED_BACKEND_VERSION } }),
    identity,
    apiBase,
  );
  assert.equal(legacyOnly.status, "blocked");
  assert.equal(legacyOnly.reason, "unverifiable");

  const mismatch = await verifyBackendCompatibility(
    async () => ({ data: { version: "6.7.8" } }),
    identity,
    apiBase,
  );
  assert.equal(mismatch.status, "blocked");
  assert.equal(mismatch.reason, "mismatch");
});

test("compatibility state is bound to session and API base and expires", () => {
  const current = verifiedState(1000);
  assert.equal(isCompatibilityCurrent(current, identity, apiBase, 2000), true);
  assert.equal(
    isCompatibilityCurrent(current, "session-b", apiBase, 2000),
    false,
  );
  assert.equal(
    isCompatibilityCurrent(current, identity, "http://other:8080/api/v1", 2000),
    false,
  );
  assert.equal(
    isCompatibilityCurrent(current, identity, apiBase, 61_001),
    false,
  );
  assert.throws(
    () => normalizeApiBase("http://firefly:8080/api/v2"),
    /must end in \/api\/v1/,
  );
  assert.throws(
    () => assertFinancialCompatibility(undefined, identity, apiBase),
    /Financial access is blocked/,
  );
});

test("API requests use the fixed server upstream and per-session bearer token", async () => {
  await withEnvironment(async () => {
    let captured;
    const client = createApiClient({
      credentialProvider: { getAccessToken: async () => "private-test-token" },
      sessionIdentity: identity,
      getCompatibilityState: () => verifiedState(),
      fetchImpl: async (url, init) => {
        captured = { url: String(url), init };
        return Response.json({ data: [] });
      },
    });
    const response = await client.request("transactions.search", {
      query: { query: "coffee shop", page: 2 },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.data, { data: [] });
    assert.equal(
      captured.url,
      `${apiBase}/search/transactions?query=coffee+shop&page=2`,
    );
    assert.equal(
      captured.init.headers.get("Authorization"),
      "Bearer private-test-token",
    );
    assert.equal(captured.init.cache, "no-store");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(captured.init.redirect, "error");
  });
});

test("API client refuses financial reads and writes unless the session gate is current", async () => {
  await withEnvironment(async () => {
    let fetchCount = 0;
    const client = createApiClient({
      credentialProvider: { getAccessToken: async () => "private-test-token" },
      sessionIdentity: identity,
      getCompatibilityState: () => undefined,
      fetchImpl: async () => {
        fetchCount += 1;
        return Response.json({ data: [] });
      },
    });

    await assert.rejects(
      client.request("accounts.index"),
      /Financial access is blocked/,
    );
    await assert.rejects(
      client.request("transactions.store", { body: { transactions: [] } }),
      /Financial access is blocked/,
    );
    assert.equal(fetchCount, 0);
  });
});

test("API client decodes empty, plain, array, and binary response bodies", async () => {
  await withEnvironment(async () => {
    const bodies = [
      new Response(null, { status: 204 }),
      new Response("ready", { headers: { "content-type": "text/plain" } }),
      Response.json([{ id: "1" }]),
      new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "application/octet-stream" },
      }),
    ];
    const client = createApiClient({
      credentialProvider: { getAccessToken: async () => "private-test-token" },
      sessionIdentity: identity,
      getCompatibilityState: () => verifiedState(),
      fetchImpl: async () => bodies.shift(),
    });

    assert.equal((await client.request("accounts.index")).data, null);
    assert.equal((await client.request("accounts.index")).data, "ready");
    assert.deepEqual(await (await client.request("accounts.index")).data, [
      { id: "1" },
    ]);
    const binary = await client.request("accounts.index");
    assert.ok(binary.data instanceof ReadableStream);
  });
});

test("API errors are normalized without copying backend messages or retrying", async () => {
  await withEnvironment(async () => {
    let calls = 0;
    const client = createApiClient({
      credentialProvider: { getAccessToken: async () => "private-test-token" },
      sessionIdentity: identity,
      getCompatibilityState: () => verifiedState(),
      fetchImpl: async () => {
        calls += 1;
        return Response.json(
          { message: "sensitive backend detail" },
          { status: 422 },
        );
      },
    });

    await assert.rejects(client.request("accounts.index"), (error) => {
      assert.ok(error instanceof ApiClientError);
      assert.equal(error.status, 422);
      assert.equal(error.retryable, false);
      assert.doesNotMatch(error.message, /sensitive backend detail/);
      assert.doesNotMatch(error.message, /private-test-token/);
      return true;
    });
    assert.equal(calls, 1);
  });
});

test("transport normalizes common status failures and safe field paths", async () => {
  await withEnvironment(async () => {
    for (const status of [401, 404, 406, 409, 415, 500]) {
      const client = createApiClient({
        credentialProvider: {
          getAccessToken: async () => "private-test-token",
        },
        sessionIdentity: identity,
        getCompatibilityState: () => verifiedState(),
        fetchImpl: async () => new Response("not useful to expose", { status }),
      });
      await assert.rejects(client.request("accounts.index"), (error) => {
        assert.ok(error instanceof ApiClientError);
        assert.equal(error.status, status);
        assert.equal(error.retryable, status === 500);
        assert.doesNotMatch(error.message, /not useful to expose/);
        return true;
      });
    }

    const client = createApiClient({
      credentialProvider: { getAccessToken: async () => "private-test-token" },
      sessionIdentity: identity,
      getCompatibilityState: () => verifiedState(),
      fetchImpl: async () =>
        Response.json(
          {
            message: "untrusted backend copy",
            errors: {
              "transactions.0.amount": ["private detail"],
              "transactions.0.currency_id": ["private detail"],
              "<script>": ["ignored"],
            },
          },
          { status: 422 },
        ),
    });
    await assert.rejects(client.request("accounts.index"), (error) => {
      assert.equal(error.status, 422);
      assert.deepEqual(error.fieldPaths, [
        "transactions.0.amount",
        "transactions.0.currency_id",
      ]);
      assert.doesNotMatch(
        error.message,
        /untrusted backend copy|private detail/,
      );
      return true;
    });
  });
});

test("transport cancellation and timeout are distinguished without write retries", async () => {
  await withEnvironment(async () => {
    const controller = new AbortController();
    controller.abort();
    const cancelled = createApiClient({
      credentialProvider: { getAccessToken: async () => "private-test-token" },
      sessionIdentity: identity,
      getCompatibilityState: () => verifiedState(),
      fetchImpl: async (_url, init) => {
        await new Promise((_, reject) => {
          if (init.signal.aborted) reject(init.signal.reason);
          else
            init.signal.addEventListener(
              "abort",
              () => reject(init.signal.reason),
              {
                once: true,
              },
            );
        });
      },
    });
    await assert.rejects(
      cancelled.request("accounts.index", { signal: controller.signal }),
      (error) => error.code === "request_aborted" && !error.retryable,
    );

    const timedOut = createApiClient({
      credentialProvider: { getAccessToken: async () => "private-test-token" },
      sessionIdentity: identity,
      getCompatibilityState: () => verifiedState(),
      timeoutMs: 5,
      fetchImpl: async (_url, init) =>
        await new Promise((_, reject) =>
          init.signal.addEventListener(
            "abort",
            () => reject(init.signal.reason),
            {
              once: true,
            },
          ),
        ),
    });
    await assert.rejects(
      timedOut.request("transactions.store", { body: { transactions: [] } }),
      (error) => error.code === "upstream_timeout" && !error.retryable,
    );
  });
});

test("pagination links cannot change origin/path and transaction search retains query", () => {
  const query = safePaginationQuery(
    "?page=2&search=coffee",
    apiBase,
    "transactions.search",
    {},
    "coffee",
  );
  assert.equal(query.get("page"), "2");
  assert.equal(query.get("query"), "coffee");
  assert.equal(query.has("search"), false);
  assert.throws(
    () =>
      safePaginationQuery(
        "https://attacker.example/steal",
        apiBase,
        "accounts.index",
      ),
    /unsafe pagination link/,
  );
  assert.throws(
    () => safePaginationQuery("/api/v1/about", apiBase, "accounts.index"),
    /unsafe pagination link/,
  );
});

test("query keys isolate identity/upstream and mutations invalidate private domains", () => {
  const first = apiQueryKey(identity, apiBase, "transactions.index", {
    start: "2026-01-01",
    currency_code: "USD",
  });
  const reordered = apiQueryKey(identity, apiBase, "transactions.index", {
    currency_code: "USD",
    start: "2026-01-01",
  });
  assert.deepEqual(first, reordered);
  assert.notDeepEqual(
    first,
    apiQueryKey("session-b", apiBase, "transactions.index", {
      start: "2026-01-01",
      currency_code: "USD",
    }),
  );
  assert.notDeepEqual(
    first,
    apiQueryKey(identity, "http://other:8080/api/v1", "transactions.index", {
      start: "2026-01-01",
      currency_code: "USD",
    }),
  );
  assert.deepEqual(invalidatedDomainsForMutation("transactions.store"), [
    "transactions",
    "accounts",
    "summary",
  ]);
  assert.deepEqual(invalidatedDomainsForMutation("transactions.index"), []);
});

test("transaction group and journal identifiers stay distinct and preserve every split", () => {
  const group = transactionGroupId("90071992547409931234");
  const journals = [
    transactionJournalId("101"),
    transactionJournalId("102"),
    transactionJournalId("103"),
  ];
  const identity = transactionIdentity(group, journals);
  assert.equal(identity.groupId, "90071992547409931234");
  assert.notEqual(identity.groupId, identity.journalIds[0]);
  assert.deepEqual(identity.journalIds, ["101", "102", "103"]);
  journals.pop();
  assert.equal(identity.journalIds.length, 3);
  assert.throws(() => transactionGroupId("1.5"), /numeric strings/);
});

test("operation paths require string IDs and transaction group routes stay explicit", () => {
  assert.equal(
    resolveOperationPath("transactions.show", {
      transactionGroup: "90071992547409931234",
    }),
    "transactions/90071992547409931234",
  );
  assert.throws(
    () => resolveOperationPath("transactions.show", { transactionGroup: 12 }),
    /numeric Firefly ID/,
  );
  assert.throws(
    () =>
      resolveOperationPath("transactions.show", { transactionGroup: "1/2" }),
    /numeric Firefly ID/,
  );
});

test("decimal arithmetic preserves arbitrary precision and currency separation", () => {
  assert.equal(
    decimalToUnits("12345678901234567890.123", 3),
    12345678901234567890123n,
  );
  assert.equal(unitsToDecimal(-123n, 2), "-1.23");
  assert.equal(unitsToDecimal(12n, 0), "12");
  assert.equal(normalizeDecimal(".5", 3), "0.500");
  assert.equal(parseLocalizedDecimal("12", "en-US", 0), "12");
  assert.equal(parseLocalizedDecimal("1.234", "en-US", 3), "1.234");
  assert.equal(
    sumMoney([
      { amount: "0.01", code: "USD", decimalPlaces: 2 },
      { amount: "0.02", code: "USD", decimalPlaces: 2 },
    ]).amount,
    "0.03",
  );
  assert.throws(
    () =>
      sumMoney([
        { amount: "1", code: "USD", decimalPlaces: 2 },
        { amount: "1", code: "EUR", decimalPlaces: 2 },
      ]),
    /same currency and precision/,
  );
  assert.throws(
    () => normalizeDecimal("1.001", 2),
    /more than 2 decimal places/,
  );
});

test("localized decimal parsing and currency formatting do not use floating point", () => {
  assert.equal(parseLocalizedDecimal("1.234,50", "de-DE", 2), "1234.50");
  assert.equal(parseLocalizedDecimal("1,234.50", "en-US", 2), "1234.50");
  assert.equal(
    formatMoney(
      { amount: "123456789012345.67", code: "USD", decimalPlaces: 2 },
      "en-US",
    ),
    "$123,456,789,012,345.67",
  );
  assert.throws(
    () => parseLocalizedDecimal("1,,234", "en-US", 2),
    /valid decimal/,
  );
});

test("date-only, inclusive, fiscal, timezone, and DST boundaries are explicit", () => {
  assert.deepEqual(validateInclusiveDateRange("2024-02-29", "2024-03-01"), {
    start: "2024-02-29",
    end: "2024-03-01",
  });
  assert.equal(fiscalYearRange("2026-03-31", 4).start, "2025-04-01");
  assert.equal(fiscalYearRange("2026-04-01", 4).end, "2027-03-31");
  assert.equal(formatDateOnly("2026-01-01", "en-US"), "Jan 1, 2026");
  assert.equal(
    dateOnlyInTimeZone("2026-03-08T07:30:00Z", "America/Los_Angeles"),
    "2026-03-07",
  );
  assert.equal(
    formatTimestamp("2026-03-08T10:00:00Z", "America/Los_Angeles", "en-US", {
      hour: "numeric",
      timeZoneName: "short",
    }),
    "3 AM PDT",
  );
  assert.throws(
    () => validateInclusiveDateRange("2026-02-30", "2026-03-01"),
    /not a calendar date/,
  );
});
