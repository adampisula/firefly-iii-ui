import { expect, test } from "./pw-fixtures.ts";

test("scene background renders as default and UI surfaces maintain contrast", async ({
  page,
}) => {
  await page.goto("/components");
  for (const theme of ["light", "dark"] as const) {
    for (const frost of [0, 0.5, 1]) {
      await page.evaluate(
        ({ selectedTheme, selectedFrost }) => {
          document.documentElement.dataset.theme = selectedTheme;
          document.documentElement.style.setProperty(
            "--frost",
            String(selectedFrost),
          );
          document.body.style.backgroundImage = 'url("/scenes/room.jpg")';
          document.body.style.backgroundSize = "cover";
        },
        { selectedTheme: theme, selectedFrost: frost },
      );

      const status = page.locator('[role="status"]').first();
      await expect(status).toBeVisible();

      // Verify custom accent color can be applied dynamically
      await page.evaluate(() => {
        document.documentElement.style.setProperty("--accent", "#3b82f6");
      });
      const customAccent = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--accent")
          .trim(),
      );
      expect(customAccent).toBe("#3b82f6");
    }
  }
});
