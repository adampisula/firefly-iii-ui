import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";

const host = "127.0.0.1";
const port = 3101;
const origin = `http://${host}:${port}`;
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    host,
    "--port",
    String(port),
  ],
  {
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "ignore", "pipe"],
  },
);
let serverError = "";
server.stderr.setEncoding("utf8");
server.stderr.on("data", (chunk) => {
  serverError += chunk;
});

async function request(path) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Production server exited early: ${serverError}`);
    }

    try {
      return await fetch(new URL(path, origin));
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error(`Production server did not become ready: ${serverError}`);
}

try {
  const page = await request("/");
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<title>Firefly<\/title>/);

  const health = await fetch(new URL("/api/health", origin));
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });
  console.log(
    "Production smoke passed: / and /api/health returned expected responses.",
  );
} finally {
  if (server.exitCode === null && server.signalCode === null) {
    const exited = once(server, "exit");
    server.kill("SIGTERM");
    await exited;
  }
}
