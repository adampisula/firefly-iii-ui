import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("recurrences are reachable and gate on connection", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page
    .getByRole("complementary", { name: "Primary navigation" })
    .getByRole("link", { name: /Recurrences/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Connect to manage recurrences" }),
  ).toBeVisible();
});

test("recurrence routes pass axe checks", async ({ page }) => {
  for (const path of ["/recurrences", "/recurrences/1"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, path).toEqual([]);
  }
});
