import { expect, test } from "@playwright/test";

test("preference index/store/show/update and list contracts", async ({
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
  const list = await request.get("/api/v1/preferences?limit=200", { headers });
  expect(list.ok()).toBeTruthy();
  const original = await request.get("/api/v1/preferences/listPageSize", {
    headers,
  });
  const originalBody = original.ok()
    ? ((await original.json()) as {
        data?: { attributes?: { data?: unknown } };
      })
    : null;
  const originalValue = originalBody?.data?.attributes?.data;

  const store = await request.post("/api/v1/preferences", {
    headers,
    data: { name: "listPageSize", data: 25 },
  });
  expect([200, 201]).toContain(store.status());
  const show = await request.get("/api/v1/preferences/listPageSize", {
    headers,
  });
  expect(show.ok()).toBeTruthy();
  const update = await request.put("/api/v1/preferences/listPageSize", {
    headers,
    data: { data: 30 },
  });
  expect(update.ok()).toBeTruthy();
  const listShow = await request.get("/api/v1/preferences-list/1", { headers });
  expect([200, 404, 422]).toContain(listShow.status());

  await request.post("/api/v1/preferences", {
    headers,
    data: { name: "listPageSize", data: originalValue ?? 20 },
  });
});
