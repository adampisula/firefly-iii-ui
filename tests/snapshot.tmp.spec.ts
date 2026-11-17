import { test } from "./pw-fixtures.ts";
import {
  encryptSession,
  SESSION_COOKIE_NAME,
} from "../src/lib/auth/session.ts";

test("take snapshots of pages", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  // Unauthenticated Connect view in dark mode
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  await page.screenshot({
    path: "/home/apisula/.gemini/antigravity/brain/79f1bbd3-aaa0-4fca-8cb8-37d3e4ec7d23/new-connect-dark.png",
  });

  // Set authenticated session cookie
  const sessionToken = encryptSession({
    identity: "session-ines",
    user: {
      id: "1",
      email: "ines@okafor-lindqvist.family",
      role: "owner",
      blocked: false,
    },
    authType: "pat",
    patToken: "mock-token-abc",
    createdAt: Date.now(),
  });

  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  // Authenticated Overview in dark mode
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  await page.screenshot({
    path: "/home/apisula/.gemini/antigravity/brain/79f1bbd3-aaa0-4fca-8cb8-37d3e4ec7d23/new-overview-dark.png",
  });

  // Authenticated Overview in light mode
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "light";
  });
  await page.screenshot({
    path: "/home/apisula/.gemini/antigravity/brain/79f1bbd3-aaa0-4fca-8cb8-37d3e4ec7d23/new-overview-light.png",
  });

  // Mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/home/apisula/.gemini/antigravity/brain/79f1bbd3-aaa0-4fca-8cb8-37d3e4ec7d23/new-overview-mobile.png",
  });
});
