import { defineConfig } from "@playwright/test";

if (process.env.FIREFLY_IMAGE_INTEGRATION !== "1") {
  throw new Error(
    "Set FIREFLY_IMAGE_INTEGRATION=1 to enable image integration tests.",
  );
}

const apiBase = process.env.FIREFLY_TEST_BASE_URL;
if (!apiBase) {
  throw new Error(
    "Set FIREFLY_TEST_BASE_URL to the isolated local Firefly API base.",
  );
}

const target = new URL(apiBase);
if (
  target.protocol !== "http:" ||
  !["127.0.0.1", "localhost"].includes(target.hostname) ||
  target.pathname.replace(/\/$/, "") !== "/api/v1" ||
  target.username ||
  target.password ||
  target.search ||
  target.hash
) {
  throw new Error(
    "Image integration tests may target only a local HTTP /api/v1 endpoint without credentials or query data.",
  );
}

export default defineConfig({
  testDir: "./tests/integration",
  testMatch: "*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: target.toString().replace(/\/$/, ""),
    browserName: "chromium",
    trace: "off",
    screenshot: "off",
    video: "off",
    serviceWorkers: "block",
  },
});
