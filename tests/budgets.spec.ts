import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("budgets are reachable from the shell and gate on connection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page
    .getByRole("complementary", { name: "Primary navigation" })
    .getByRole("link", { name: /Budgets/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Connect to manage budgets" }),
  ).toBeVisible();
});

test("budget routes pass axe checks", async ({ page }) => {
  for (const path of [
    "/budgets",
    "/budgets/1",
    "/budgets/1/limits/2",
    "/budgets/available",
    "/budgets/without-budget",
  ]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, path).toEqual([]);
  }
});
