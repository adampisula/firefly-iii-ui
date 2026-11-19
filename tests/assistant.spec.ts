import { expect, test } from "./pw-fixtures.ts";

test("assistant is discoverable and shows the deployment-disabled state", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Assistant" }).first().click();
  await expect(page).toHaveURL(/\/assistant$/);
  await expect(
    page.getByRole("heading", { name: "AI assistant is disabled" }),
  ).toBeVisible();
  await expect(page.getByText("AI_ASSISTANT_ENABLED").first()).toBeVisible();
});

test("assistant settings explains the deployment switch", async ({ page }) => {
  await page.goto("/assistant/settings");
  await expect(
    page.getByRole("heading", { name: "Assistant is disabled" }),
  ).toBeVisible();
});
