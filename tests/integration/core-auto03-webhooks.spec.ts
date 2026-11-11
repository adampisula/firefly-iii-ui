import { expect, test } from "@playwright/test";

test("disabled webhook feature is a 404, not an empty success", async ({
  request,
}) => {
  const token = process.env.FIREFLY_TEST_PAT;
  if (!token) {
    test.skip();
    return;
  }
  const response = await request.get("/api/v1/webhooks?limit=10", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  expect(response.status()).toBe(404);
  const body = (await response.json()) as { message?: string };
  expect(body.message ?? "").toMatch(/not found/i);
});
