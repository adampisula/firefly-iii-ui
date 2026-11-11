import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";
test("owner users route gates and passes axe", async ({ page }) => {
  await page.goto("/admin/users");
  await expect(
    page.getByRole("heading", { name: "Connect to manage users" }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
