import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("webhooks route shows the disabled feature state", async ({ page }) => {
  await page.goto("/webhooks");
  // Without a session the connection gate is shown; with a session and disabled
  // backend the page renders the explicit disabled-feature state.
  await expect(
    page.getByRole("heading", {
      name: /Connect to view webhooks|Webhooks are disabled/,
    }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
