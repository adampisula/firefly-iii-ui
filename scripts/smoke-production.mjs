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
  const html = await page.text();
  assert.match(html, /<title>Firefly<\/title>/);

  const assetPaths = new Set([
    ...Array.from(
      html.matchAll(/(?:href|src)="([^"]+\.(?:css|js|woff2?|jpg|png|webp))"/g),
      (match) => match[1],
    ),
    "/fonts/urbanist.css",
    "/scenes/room.jpg",
    "/scenes/room-blur.jpg",
  ]);
  for (const path of assetPaths) {
    if (path.startsWith("data:")) continue;
    const assetUrl = new URL(path, origin);
    assert.equal(assetUrl.origin, origin, `Unexpected external asset: ${path}`);
    const asset = await fetch(assetUrl);
    assert.equal(asset.status, 200, `Missing asset: ${path}`);
    const body = await asset.arrayBuffer();
    assert.ok(body.byteLength > 0, `Empty asset: ${path}`);
  }

  const health = await fetch(new URL("/api/health", origin));
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });
  console.log(
    `Production smoke passed: /, ${assetPaths.size} assets and /api/health returned expected responses.`,
  );
} finally {
  if (server.exitCode === null && server.signalCode === null) {
    const exited = once(server, "exit");
    server.kill("SIGTERM");
    await exited;
  }
}
