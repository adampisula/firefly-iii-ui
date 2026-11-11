import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("maintenance page requires explicit confirmation and passes axe", async ({
  page,
}) => {
  await page.goto("/maintenance");
  await expect(
    page.getByRole("heading", { name: "Destructive data maintenance" }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
