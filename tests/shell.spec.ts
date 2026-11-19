import { expect, test } from "./pw-fixtures.ts";

test("desktop rail exposes primary navigation and keyboard skip link", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  const rail = page.getByRole("complementary", { name: "Primary navigation" });
  await expect(rail).toBeVisible();
  await expect(rail.getByRole("link", { name: /Accounts/ })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Breadcrumb" }),
  ).toContainText("Firefly");

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();
});

test("mobile shell keeps all sections reachable through More", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");

  await expect(
    page.getByRole("complementary", { name: "Primary navigation" }),
  ).toBeHidden();
  const bottomNav = page.getByRole("navigation", {
    name: "Frequent destinations",
  });
  await expect(bottomNav).toBeVisible();
  await expect(bottomNav.getByRole("link", { name: "Overview" })).toBeVisible();

  await bottomNav.getByRole("button", { name: /More/ }).click();
  const dialog = page.getByRole("dialog", { name: "All sections" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: /Settings/ })).toBeVisible();
  await expect(dialog.getByRole("link", { name: /Reports/ })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("appearance choices persist locally and apply before reload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await page
    .getByRole("button", { name: "Appearance", exact: true })
    .last()
    .click();
  const dialog = page.getByRole("dialog", { name: "Appearance" });
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("Theme").selectOption("dark");
  await dialog.getByLabel("Use opaque surfaces (reduced transparency)").check();
  await dialog.getByRole("button", { name: "Blue" }).click();

  const opacity = dialog.getByLabel(/Background opacity/);
  await opacity.focus();
  await opacity.press("End");
  const slab = page.locator('[class*="slab"]');
  const opaque = dialog.getByLabel(
    "Use opaque surfaces (reduced transparency)",
  );
  await opaque.uncheck();
  await expect(slab).toHaveCSS("backdrop-filter", /blur/);
  await dialog.getByLabel("Frost the main window").uncheck();
  await expect(slab).toHaveCSS("backdrop-filter", "none");
  await opaque.check();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute(
    "data-reduced-transparency",
    "true",
  );
  const accent = await page.evaluate(() =>
    document.documentElement.style.getPropertyValue("--accent-base"),
  );
  expect(accent).toBe("#93c5fd");
  expect(
    await page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--surface-alpha"),
    ),
  ).toBe("100%");
  await expect(page.locator("html")).toHaveAttribute(
    "data-frost-main",
    "false",
  );

  await dialog.getByLabel("Custom hex").fill("#ffff00");
  await dialog.getByRole("button", { name: "Apply" }).click();
  await expect(dialog.getByText(/too light/i)).toBeVisible();

  const stored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("ff.appearance") ?? "{}"),
  );
  expect(stored).toMatchObject({
    theme: "dark",
    surfaceOpacity: 1,
    frostMain: false,
    reducedTransparency: true,
    accent: { mode: "preset", value: "blue" },
  });

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute(
    "data-frost-main",
    "false",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-reduced-transparency",
    "true",
  );
});

test("amount privacy masks content and is announced", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Hide amounts" }).last().click();

  await expect(page.locator("html")).toHaveAttribute("data-privacy", "true");
  await expect(page.getByText("Amounts are hidden")).toBeAttached();
  expect(
    await page.evaluate(() => window.localStorage.getItem("ff.privacy")),
  ).toBe("true");

  await page.goto("/components");
  await expect(page.getByText("Amount hidden").first()).toBeVisible();
  await expect(page.getByText("€12.34", { exact: true })).toHaveCount(0);
});

test("date range is URL backed and survives reload", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Date range").selectOption("last-30-days");

  await expect(page).toHaveURL(/range=last-30-days/);
  await page.reload();
  await expect(page.getByLabel("Date range")).toHaveValue("last-30-days");
});

test("unsupported deep links and unknown routes are honest", async ({
  page,
}) => {
  await page.goto("/reports");
  await expect(
    page.getByRole("heading", { name: "Report families are unsupported" }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Report families are unsupported" }),
  ).toBeVisible();

  await page.goto("/definitely-not-a-section");
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});
