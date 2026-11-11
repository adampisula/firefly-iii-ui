import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("categories are reachable and gate on connection", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page
    .getByRole("complementary", { name: "Primary navigation" })
    .getByRole("link", { name: /Categories/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Connect to manage categories" }),
  ).toBeVisible();
});

test("classification routes pass axe checks", async ({ page }) => {
  for (const path of [
    "/categories",
    "/categories/1",
    "/tags",
    "/tags/Holiday%20%E2%9C%93",
    "/object-groups",
    "/object-groups/1",
  ]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, path).toEqual([]);
  }
});
