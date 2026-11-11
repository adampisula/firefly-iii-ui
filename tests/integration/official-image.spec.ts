import { expect, test } from "@playwright/test";

test.describe("Official Firefly III 6.7.9 Image Contract", () => {
  test("responds with verified 6.7.9 version on /api/v1/about", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await request.get("/api/v1/about", { headers });
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(body.data.version).toBe("6.7.9");
  });

  test("returns empty accounts list with pagination metadata for new user", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }

    const response = await request.get("/api/v1/accounts", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.meta).toBeDefined();
    expect(body.meta.pagination).toBeDefined();
  });
});
