import { spawn } from "node:child_process";

if (process.env.FIREFLY_IMAGE_INTEGRATION !== "1") {
  console.error(
    "Firefly image integration tests are opt-in. Set FIREFLY_IMAGE_INTEGRATION=1 and FIREFLY_TEST_BASE_URL to an isolated local image.",
  );
  process.exit(1);
}

const target = process.env.FIREFLY_TEST_BASE_URL;
if (!target) {
  console.error(
    "FIREFLY_TEST_BASE_URL must point to a local /api/v1 endpoint.",
  );
  process.exit(1);
}

let parsedTarget;
try {
  parsedTarget = new URL(target);
} catch {
  console.error("FIREFLY_TEST_BASE_URL must be an absolute URL.");
  process.exit(1);
}

if (
  parsedTarget.protocol !== "http:" ||
  !["127.0.0.1", "localhost"].includes(parsedTarget.hostname) ||
  parsedTarget.pathname.replace(/\/$/, "") !== "/api/v1" ||
  parsedTarget.username ||
  parsedTarget.password ||
  parsedTarget.search ||
  parsedTarget.hash
) {
  console.error(
    "Refusing non-local targets; integration tests require an isolated local HTTP /api/v1 endpoint.",
  );
  process.exit(1);
}

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const child = spawn(
  npm,
  [
    "exec",
    "--offline",
    "--",
    "playwright",
    "test",
    "--config",
    "playwright.integration.config.ts",
  ],
  { stdio: "inherit", env: process.env },
);

child.on("error", (error) => {
  console.error(
    `Could not start the isolated image test runner: ${error.message}`,
  );
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
