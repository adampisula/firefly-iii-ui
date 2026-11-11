import { expect, test } from "./pw-fixtures.ts";

const WIDTHS = [
  320, 390, 759, 760, 761, 768, 1024, 1179, 1180, 1181, 1280, 1440,
];

test("boundary widths avoid full-page horizontal overflow and keep navigation reachable", async ({
  page,
}) => {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth, `width ${width}`).toBeLessThanOrEqual(
      overflow.clientWidth + 1,
    );
    if (width <= 760) {
      await expect(
        page.getByRole("navigation", { name: "Frequent destinations" }),
        `bottom nav at ${width}`,
      ).toBeVisible();
      await expect(
        page.getByRole("complementary", { name: "Primary navigation" }),
        `rail hidden at ${width}`,
      ).toBeHidden();
    } else {
      await expect(
        page.getByRole("complementary", { name: "Primary navigation" }),
        `rail visible at ${width}`,
      ).toBeVisible();
    }
  }
});

test("zoom/reflow keeps a 320px-equivalent layout usable", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
