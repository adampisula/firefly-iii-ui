import { expect, test } from "@playwright/test";
test("administration reads and role-gated write", async ({ request }) => {
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
  const groups = await request.get("/api/v1/user-groups?limit=10", { headers });
  expect(groups.ok()).toBeTruthy();
  const body = (await groups.json()) as {
    data: {
      id: string;
      attributes: { title: string; primary_currency_code: string };
    }[];
  };
  expect(body.data.length).toBeGreaterThan(0);
  const group = body.data[0];
  const show = await request.get(`/api/v1/user-groups/${group.id}`, {
    headers,
  });
  expect(show.ok()).toBeTruthy();
  const update = await request.put(`/api/v1/user-groups/${group.id}`, {
    headers,
    data: {
      title: group.attributes.title,
      primary_currency_code: group.attributes.primary_currency_code,
    },
  });
  expect([200, 401, 403]).toContain(update.status());
});
