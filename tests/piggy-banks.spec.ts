import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("savings goals are reachable and gate on connection", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page
    .getByRole("complementary", { name: "Primary navigation" })
    .getByRole("link", { name: /Savings goals/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Connect to manage savings goals" }),
  ).toBeVisible();
});

test("savings-goal routes pass axe checks", async ({ page }) => {
  for (const path of ["/piggy-banks", "/piggy-banks/1"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, path).toEqual([]);
  }
});
