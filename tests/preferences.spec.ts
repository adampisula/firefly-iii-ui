import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("preferences page gates and passes axe checks", async ({ page }) => {
  await page.goto("/preferences");
  await expect(
    page.getByRole("heading", { name: "Connect to manage preferences" }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
