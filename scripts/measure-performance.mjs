import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const port = 3210;
const server = spawn(
  "npm",
  ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)],
  { stdio: "ignore", env: process.env },
);
const stop = () => server.kill("SIGTERM");
process.on("exit", stop);
for (let attempt = 0; attempt < 60; attempt += 1) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    if (response.ok) break;
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 500));
}
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const results = [];
for (const path of ["/", "/search", "/accounts", "/budgets"]) {
  await page.goto(`http://127.0.0.1:${port}${path}`, {
    waitUntil: "networkidle",
  });
  const metrics = await page.evaluate(async () => {
    const lcp = await new Promise((resolve) => {
      let value = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) value = entry.startTime;
      });
      try {
        observer.observe({ type: "largest-contentful-paint", buffered: true });
      } catch {}
      setTimeout(() => {
        observer.disconnect();
        resolve(value);
      }, 300);
    });
    const layoutShift = await new Promise((resolve) => {
      let value = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (!entry.hadRecentInput) value += entry.value;
      });
      try {
        observer.observe({ type: "layout-shift", buffered: true });
      } catch {}
      setTimeout(() => {
        observer.disconnect();
        resolve(value);
      }, 300);
    });
    return { lcp, cls: layoutShift };
  });
  results.push({ path, ...metrics });
}
await browser.close();
stop();
console.log(JSON.stringify(results, null, 2));
