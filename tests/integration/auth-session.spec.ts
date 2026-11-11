import { expect, test } from "@playwright/test";

test.describe("Authentication and Session Handling with Live Backend", () => {
  test("authenticates with PAT and obtains current user session", async ({
    request,
  }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }

    const response = await request.get("/api/v1/about/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.data.type).toBe("users");
    expect(data.data.attributes.email).toBe("test@example.com");
    expect(data.data.attributes.blocked).toBe(false);
  });

  test("rejects invalid token with 401 Unauthenticated", async ({
    request,
  }) => {
    const response = await request.get("/api/v1/about/user", {
      headers: {
        Authorization: "Bearer invalid-token-sample-1234",
        Accept: "application/json",
      },
    });

    expect(response.status()).toBe(401);
  });
});
