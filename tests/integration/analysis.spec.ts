import { expect, test } from "@playwright/test";

const headersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
});

test.describe("ANA-01/02 chart and insight contracts", () => {
  test("all chart and summary operations respond", async ({ request }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const range = "start=2026-01-01&end=2026-12-31";
    for (const path of [
      "/api/v1/summary/basic",
      "/api/v1/chart/balance/balance",
      "/api/v1/chart/account/overview",
      "/api/v1/chart/budget/overview",
      "/api/v1/chart/budget/overview-with-limits",
      "/api/v1/chart/category/overview",
    ]) {
      const response = await request.get(`${path}?${range}`, { headers });
      expect(response.status(), path).toBe(200);
    }
  });

  test("all 26 insight operations respond", async ({ request }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const paths = [
      "expense/expense",
      "expense/asset",
      "expense/total",
      "expense/bill",
      "expense/no-bill",
      "expense/subscription",
      "expense/no-subscription",
      "expense/budget",
      "expense/no-budget",
      "expense/category",
      "expense/no-category",
      "expense/tag",
      "expense/no-tag",
      "income/revenue",
      "income/asset",
      "income/total",
      "income/category",
      "income/no-category",
      "income/tag",
      "income/no-tag",
      "transfer/asset",
      "transfer/category",
      "transfer/no-category",
      "transfer/tag",
      "transfer/no-tag",
      "transfer/total",
    ];
    for (const path of paths) {
      const response = await request.get(
        `/api/v1/insight/${path}?start=2026-01-01&end=2026-12-31`,
        { headers },
      );
      expect(response.status(), path).toBe(200);
    }
  });
});

test("SYS-08 release notes and configuration health surfaces respond", async ({
  request,
}) => {
  const token = process.env.FIREFLY_TEST_PAT;
  if (!token) {
    test.skip();
    return;
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  for (const path of ["/api/v1/release-notes", "/api/v1/configuration"]) {
    const response = await request.get(path, { headers });
    expect(response.status(), path).toBe(200);
  }
});

test("all CSV export families respond", async ({ request }) => {
  const token = process.env.FIREFLY_TEST_PAT;
  if (!token) {
    test.skip();
    return;
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  for (const resource of [
    "accounts",
    "transactions",
    "bills",
    "subscriptions",
    "budgets",
    "categories",
    "piggy-banks",
    "recurring",
    "rules",
    "tags",
  ]) {
    const response = await request.get(`/api/v1/data/export/${resource}`, {
      headers,
    });
    expect(response.status(), resource).toBe(200);
  }
});
