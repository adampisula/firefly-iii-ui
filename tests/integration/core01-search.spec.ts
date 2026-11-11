import { expect, test } from "@playwright/test";

const headersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
});

test.describe("CORE-01 search and autocomplete contracts", () => {
  const families = [
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
  ];

  test("all fifteen autocomplete families respond", async ({ request }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    for (const family of families) {
      const response = await request.get(
        `/api/v1/autocomplete/${family}?query=a&limit=5`,
        { headers },
      );
      expect(response.status(), family).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body), family).toBeTruthy();
    }
  });

  test("transaction search and its separate count endpoint respond", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const query = encodeURIComponent('description:"core-one-no-match"');

    const search = await request.get(
      `/api/v1/search/transactions?query=${query}&limit=10&page=1`,
      { headers },
    );
    expect(search.ok()).toBeTruthy();
    const searchBody = (await search.json()) as {
      data: unknown[];
      meta?: { pagination?: { current_page?: number } };
    };
    expect(Array.isArray(searchBody.data)).toBeTruthy();
    expect(searchBody.meta?.pagination?.current_page).toBe(1);

    const count = await request.get(
      `/api/v1/search/transactions/count?query=${query}`,
      { headers },
    );
    expect(count.ok()).toBeTruthy();
    const countBody = (await count.json()) as { count?: number };
    expect(typeof countBody.count).toBe("number");
  });

  test("account search accepts supported fields and rejects unknown fields", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const ok = await request.get(
      "/api/v1/search/accounts?query=a&field=name&type=asset",
      { headers },
    );
    expect(ok.ok()).toBeTruthy();
    const body = (await ok.json()) as { data: unknown[] };
    expect(Array.isArray(body.data)).toBeTruthy();

    const invalid = await request.get(
      "/api/v1/search/accounts?query=a&field=not-a-field",
      { headers },
    );
    expect(invalid.status()).toBe(422);
  });
});
