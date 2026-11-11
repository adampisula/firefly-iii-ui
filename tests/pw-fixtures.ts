import { test as base, expect } from "@playwright/test";

export const LOCAL_TEST_ORIGIN = "http://127.0.0.1:3100";

export const test = base.extend({
  page: async ({ page, baseURL }, provide) => {
    if (!baseURL)
      throw new Error("Playwright baseURL is required in mock mode.");
    const localOrigin = new URL(baseURL).origin;
    await page.route("**/*", async (route) => {
      if (new URL(route.request().url()).origin !== localOrigin) {
        await route.abort("blockedbyclient");
        return;
      }
      await route.continue();
    });
    await provide(page);
  },
});

export { expect };
