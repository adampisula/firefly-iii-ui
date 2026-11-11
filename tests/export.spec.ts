import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("export page explains downloads and importer boundary", async ({
  page,
}) => {
  await page.goto("/export");
  await expect(
    page.getByRole("heading", { name: "CSV exports and Data Importer" }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
