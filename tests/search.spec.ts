import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("search is reachable from the shell and gates on connection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Frequent destinations" })
    .getByRole("button", { name: /More/ })
    .click();
  await page
    .getByRole("dialog", { name: "All sections" })
    .getByRole("link", {
      name: /Search/,
    })
    .click();

  await expect(
    page.getByRole("heading", { name: "Connect to search Firefly" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Connect account" }),
  ).toBeVisible();
});

test("search connection gate passes axe checks", async ({ page }) => {
  await page.goto("/search");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("search deep link preserves the query parameter", async ({ page }) => {
  await page.goto("/search?query=description%3A%22coffee%22&page=2");
  await expect(page).toHaveURL(/query=description/);
  await expect(
    page.getByRole("heading", { name: "Connect to search Firefly" }),
  ).toBeVisible();
});
