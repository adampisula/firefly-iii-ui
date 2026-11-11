import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("transactions are reachable and gate on connection", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Frequent destinations" })
    .getByRole("link", { name: "Transactions" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Connect to read transactions" }),
  ).toBeVisible();
});

test("transaction routes pass axe checks", async ({ page }) => {
  for (const path of [
    "/transactions",
    "/transactions/123",
    "/transactions/journal/456",
  ]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, path).toEqual([]);
  }
});
