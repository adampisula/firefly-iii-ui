import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("insights are reachable and gate on connection", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page
    .getByRole("complementary", { name: "Primary navigation" })
    .getByRole("link", { name: /Insights/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Connect to view insights" }),
  ).toBeVisible();
});

test("insight route passes axe checks", async ({ page }) => {
  await page.goto("/insights");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
