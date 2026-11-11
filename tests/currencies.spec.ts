import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("currency and exchange-rate pages gate on connection", async ({
  page,
}) => {
  for (const path of ["/currencies", "/currencies/EUR", "/exchange-rates"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, path).toEqual([]);
  }
});
