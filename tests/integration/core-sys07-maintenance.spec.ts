import { expect, test } from "@playwright/test";

test("data destroy and purge endpoints accept confirmed families", async ({
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
    "Content-Type": "application/json",
  };
  const category = await request.post("/api/v1/categories", {
    headers,
    data: { name: `SYS-07 disposable ${Date.now().toString(36)}` },
  });
  expect(category.ok()).toBeTruthy();
  const destroy = await request.delete(
    "/api/v1/data/destroy?objects=categories&unused=false",
    { headers },
  );
  expect([200, 204]).toContain(destroy.status());
  const purge = await request.delete("/api/v1/data/purge", { headers });
  expect([200, 204]).toContain(purge.status());
});
