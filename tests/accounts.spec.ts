import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("accounts gates on connection and is reachable from the rail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page
    .getByRole("complementary", { name: "Primary navigation" })
    .getByRole("link", { name: /Accounts/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Connect to manage accounts" }),
  ).toBeVisible();
});

test("account routes pass axe checks", async ({ page }) => {
  for (const path of [
    "/accounts",
    "/accounts/new",
    "/accounts/123",
    "/accounts/123/reconcile",
  ]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, path).toEqual([]);
  }
});
