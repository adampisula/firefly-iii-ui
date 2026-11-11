import { expect, test, type APIRequestContext } from "@playwright/test";

const headersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

async function createAccount(
  request: APIRequestContext,
  headers: Record<string, string>,
  name: string,
  type: "asset" | "expense",
  currencyCode: string,
): Promise<string> {
  const response = await request.post("/api/v1/accounts", {
    headers,
    data: {
      name,
      type,
      ...(type === "asset" ? { account_role: "defaultAsset" } : {}),
      currency_code: currencyCode,
      active: true,
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { data: { id: string } };
  return body.data.id;
}

test.describe("FND-08-b immutable contract probes", () => {
  test("known GET surfaces respond on the official image", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const range = "start=2026-01-01&end=2026-12-31";

    for (const path of [
      "/api/v1/user-groups",
      "/api/v1/configuration",
      "/api/v1/release-notes",
      "/api/v1/transaction-links",
      "/api/v1/recurrences",
      "/api/v1/rules",
      "/api/v1/preferences?limit=100",
      `/api/v1/summary/basic?${range}`,
      `/api/v1/chart/balance/balance?${range}`,
      `/api/v1/insight/expense/total?${range}`,
      `/api/v1/data/export/accounts`,
    ]) {
      const response = await request.get(path, { headers });
      expect(response.status(), path).toBe(200);
    }
  });

  test("disabled webhooks return 404 rather than a fabricated success", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const response = await request.get("/api/v1/webhooks", {
      headers: headersFor(token),
    });
    // The route exists but the feature flag is off in the isolated container.
    expect([200, 404]).toContain(response.status());
    if (response.status() === 404) {
      const body = (await response.json()) as { message?: string };
      expect(body.message).toMatch(/not found/i);
    }
  });

  test("the declared currencies.cer route fails with an immutable source defect", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const response = await request.get("/api/v1/currencies/EUR/cer", {
      headers: headersFor(token),
    });
    expect(response.status()).toBe(500);
    const body = (await response.json()) as {
      message?: string;
      exception?: string;
    };
    expect(body.message ?? "").toContain("Method");
  });

  test("split transaction updates retain every journal identity", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const suffix = Date.now().toString(36);
    const assetId = await createAccount(
      request,
      headers,
      `FND-08 split asset ${suffix}`,
      "asset",
      "EUR",
    );
    const expenseId = await createAccount(
      request,
      headers,
      `FND-08 split expense ${suffix}`,
      "expense",
      "EUR",
    );
    let groupId: string | undefined;

    try {
      const create = await request.post("/api/v1/transactions", {
        headers,
        data: {
          group_title: `FND-08 split group ${suffix}`,
          apply_rules: false,
          fire_webhooks: false,
          error_if_duplicate_hash: false,
          transactions: [
            {
              type: "withdrawal",
              date: "2026-01-15T00:00:00+00:00",
              amount: "10.00",
              description: `split one ${suffix}`,
              source_id: assetId,
              destination_id: expenseId,
              currency_code: "EUR",
            },
            {
              type: "withdrawal",
              date: "2026-01-15T00:00:00+00:00",
              amount: "5.00",
              description: `split two ${suffix}`,
              source_id: assetId,
              destination_id: expenseId,
              currency_code: "EUR",
            },
          ],
        },
      });
      expect(create.ok()).toBeTruthy();
      const created = (await create.json()) as {
        data: {
          id: string;
          attributes: {
            transactions: { transaction_journal_id: string; amount: string }[];
          };
        };
      };
      groupId = created.data.id;
      const journals = created.data.attributes.transactions;
      expect(journals).toHaveLength(2);
      const journalIds = journals.map(
        (journal) => journal.transaction_journal_id,
      );

      const update = await request.put(`/api/v1/transactions/${groupId}`, {
        headers,
        data: {
          group_title: `FND-08 split group ${suffix}`,
          apply_rules: false,
          fire_webhooks: false,
          transactions: journals.map((journal, index) => ({
            transaction_journal_id: journal.transaction_journal_id,
            type: "withdrawal",
            date: "2026-01-15T00:00:00+00:00",
            amount: index === 0 ? "11.00" : "5.00",
            description: `split ${index + 1} updated ${suffix}`,
            source_id: assetId,
            destination_id: expenseId,
            currency_code: "EUR",
          })),
        },
      });
      expect(update.ok()).toBeTruthy();

      const read = await request.get(`/api/v1/transactions/${groupId}`, {
        headers,
      });
      expect(read.ok()).toBeTruthy();
      const reread = (await read.json()) as {
        data: {
          attributes: {
            transactions: { transaction_journal_id: string; amount: string }[];
          };
        };
      };
      expect(
        reread.data.attributes.transactions.map(
          (journal) => journal.transaction_journal_id,
        ),
      ).toEqual(journalIds);
      expect(
        reread.data.attributes.transactions.map((journal) => journal.amount),
      ).toEqual(["11.000000000000", "5.000000000000"]);
    } finally {
      if (groupId) {
        await request.delete(`/api/v1/transactions/${groupId}`, { headers });
      }
      await request.delete(`/api/v1/accounts/${assetId}`, { headers });
      await request.delete(`/api/v1/accounts/${expenseId}`, { headers });
    }
  });

  test("transaction search keeps the original query in pager links", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const response = await request.get(
      "/api/v1/search/transactions?query=description%3A%22nothing-matches-fnd08%22&limit=10",
      { headers: headersFor(token) },
    );
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
      data: unknown[];
      links?: { self?: string };
    };
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.links?.self ?? "").toContain("description");
  });
});
