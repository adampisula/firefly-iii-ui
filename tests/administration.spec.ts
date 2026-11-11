import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";
test("administration route gates and passes axe", async ({ page }) => {
  await page.goto("/administration");
  await expect(
    page.getByRole("heading", {
      name: "Connect to view administration settings",
    }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
