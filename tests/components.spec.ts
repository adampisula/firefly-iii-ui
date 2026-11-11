import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("the shared component gallery has no axe violations in both themes", async ({
  page,
}) => {
  await page.goto("/components");
  const opener = page.getByRole("button", { name: "Open dialog" });
  await opener.click();
  await expect(
    page.getByRole("dialog", { name: "Example dialog" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Example dialog" }),
  ).toBeHidden();
  await expect(page.getByText("Journal ID: sample-journal-1")).toBeVisible();
  await expect(page.getByText("€12.34", { exact: true })).toBeVisible();

  for (const theme of ["light", "dark"] as const) {
    for (const frost of [0, 0.5, 1]) {
      await page.evaluate(
        ({ selectedTheme, selectedFrost }) => {
          document.documentElement.dataset.theme = selectedTheme;
          document.documentElement.style.setProperty(
            "--frost",
            String(selectedFrost),
          );
        },
        { selectedTheme: theme, selectedFrost: frost },
      );
      const expectedAccent = theme === "dark" ? "#6ee0a1" : "#137a50";
      await page.waitForFunction(
        (accent) =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--accent")
            .trim() === accent,
        expectedAccent,
      );

      await page.waitForFunction((selectedTheme) => {
        const quietButton = document.querySelector('[class*="button_quiet"]');
        const primaryButton = document.querySelector(
          '[class*="button_primary"]',
        );
        if (!quietButton || !primaryButton) return false;
        const expectedQuiet =
          selectedTheme === "dark" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
        const expectedPrimary =
          selectedTheme === "dark" ? "rgb(110, 224, 161)" : "rgb(19, 122, 80)";
        return (
          getComputedStyle(quietButton).backgroundColor === expectedQuiet &&
          getComputedStyle(primaryButton).backgroundColor === expectedPrimary
        );
      }, theme);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, `${theme} theme at frost ${frost}`).toEqual(
        [],
      );
    }
  }
});

test("dialog closes with Escape and returns focus to its opener", async ({
  page,
}) => {
  await page.goto("/components");
  const opener = page.getByRole("button", { name: "Open dialog" });
  await opener.click();

  const dialog = page.getByRole("dialog", { name: "Example dialog" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("combobox and tabs support keyboard selection", async ({ page }) => {
  await page.goto("/components");
  const combo = page.getByRole("combobox", {
    name: "Asynchronous option example",
  });
  await combo.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(combo).toHaveValue("Example option two");

  const overview = page.getByRole("tab", { name: "Overview" });
  const details = page.getByRole("tab", { name: "Details" });
  await overview.focus();
  await page.keyboard.press("ArrowRight");
  await expect(details).toBeFocused();
  await expect(details).toHaveAttribute("aria-selected", "true");
});

test("selection, pagination, disabled controls, and narrow reflow remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/components");

  await page.getByRole("checkbox", { name: "Select all rows" }).check();
  await expect(page.getByText("2 example rows selected")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Page 2 of 4")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Unavailable action" }),
  ).toBeDisabled();

  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);

  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await page.getByRole("checkbox", { name: "Select all rows" }).check();
  const zoomedDimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(zoomedDimensions.body).toBeLessThanOrEqual(zoomedDimensions.viewport);
});

test("drawer adapts to a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/components");
  await page.getByRole("button", { name: "Open drawer" }).click();
  const drawer = page.getByRole("dialog", { name: "Example drawer" });
  await expect(drawer).toBeVisible();
  const bounds = await drawer.boundingBox();
  expect(bounds).not.toBeNull();
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(800);
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
});

test("reduced motion and forced-colors preferences are respected", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await page.goto("/components");
  const skipLink = page.getByRole("link", {
    name: "Skip to component examples",
  });
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  const preferences = await page.evaluate(() => ({
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    forcedColors: matchMedia("(forced-colors: active)").matches,
  }));
  expect(preferences).toEqual({ reducedMotion: true, forcedColors: true });
  const transitionDuration = await page
    .getByRole("button", { name: "Open dialog" })
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).transitionDuration),
    );
  expect(transitionDuration).toBeLessThanOrEqual(0.001);
});
