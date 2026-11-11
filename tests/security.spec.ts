import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("security handoff page explains native identity ownership", async ({
  page,
}) => {
  await page.goto("/security");
  await expect(
    page.getByRole("heading", { name: "Trusted native identity handoffs" }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
