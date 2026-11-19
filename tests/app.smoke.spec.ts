import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./pw-fixtures.ts";

test("the application shell renders the English connection view", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Firefly");
  await expect(
    page.getByRole("heading", { name: "Your finances, under your control." }),
  ).toBeVisible();
  await expect(page.getByLabel("Personal access token")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Connect account" }),
  ).toBeVisible();
  await expect(page.getByText("Safe to spend today")).toHaveCount(0);
  await expect(page.getByText("Your cards")).toHaveCount(0);
  await expect(page.getByText("Ines Okafor")).toHaveCount(0);
});

test("the connection shell passes axe accessibility checks", async ({
  page,
}) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("the panel body text keeps contrast at both frost extremes", async ({
  page,
}) => {
  await page.goto("/");

  for (const theme of ["light", "dark"] as const) {
    for (const frost of [0, 0.5, 1]) {
      const contrast = await page.evaluate(
        ({
          selectedTheme,
          selectedFrost,
        }: {
          selectedTheme: "light" | "dark";
          selectedFrost: number;
        }) => {
          const root = document.documentElement;
          root.dataset.theme = selectedTheme;
          root.style.setProperty("--frost", String(selectedFrost));

          const surface = document.querySelector<HTMLElement>(".panel");
          const paragraph = surface?.querySelector<HTMLElement>("p");
          const context = document.createElement("canvas").getContext("2d");
          if (!surface || !paragraph || !context)
            throw new Error("Contrast sample could not be created.");

          const surfaceStyle = getComputedStyle(surface);
          const textStyle = getComputedStyle(paragraph);
          context.fillStyle = surfaceStyle.backgroundColor;
          context.fillRect(0, 0, 2, 1);
          context.fillStyle = textStyle.color;
          context.fillRect(1, 0, 1, 1);
          const background = [...context.getImageData(0, 0, 1, 1).data];
          const foreground = [...context.getImageData(1, 0, 1, 1).data];

          const luminance = ([red, green, blue]: number[]) => {
            const linear = (channel: number) => {
              const value = channel / 255;
              return value <= 0.04045
                ? value / 12.92
                : ((value + 0.055) / 1.055) ** 2.4;
            };
            return (
              0.2126 * linear(red) +
              0.7152 * linear(green) +
              0.0722 * linear(blue)
            );
          };
          const first = luminance(foreground);
          const second = luminance(background);
          return (
            (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
          );
        },
        { selectedTheme: theme, selectedFrost: frost },
      );

      expect(
        contrast,
        `${theme} theme at frost ${frost}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }
});
