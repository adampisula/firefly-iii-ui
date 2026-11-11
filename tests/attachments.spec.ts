import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("attachments are reachable from the rail and gate on connection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page
    .getByRole("complementary", { name: "Primary navigation" })
    .getByRole("link", { name: /Attachments/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Connect to manage attachments" }),
  ).toBeVisible();
});

test("attachment routes pass axe checks", async ({ page }) => {
  for (const path of ["/attachments", "/attachments/1"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, path).toEqual([]);
  }
});
