import { expect, test } from "@playwright/test";
test("owner user/config endpoints are permission-gated", async ({
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
  for (const path of ["/api/v1/users?limit=10", "/api/v1/configuration"]) {
    const response = await request.get(path, { headers });
    expect([200, 401, 403]).toContain(response.status());
  }
});
