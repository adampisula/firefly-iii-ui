import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const root = ".next/static";
const forbidden = [
  /FIREFLY_TEST_PAT/,
  /BACKEND_INTERNAL_API_URL/,
  /SESSION_SECRET/,
  /eyJ0eXAiOiJKV1Qi/,
  /127\.0\.0\.1:8089/,
  /postgres:\/\//,
  /mysql:\/\//,
];
const findings = [];
let files = 0;
let bytes = 0;

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile()) {
      files += 1;
      bytes += (await stat(path)).size;
      const text = await readFile(path, "utf8").catch(() => "");
      for (const pattern of forbidden)
        if (pattern.test(text)) findings.push(`${path}: ${pattern}`);
    }
  }
}
await walk(root);
console.log(JSON.stringify({ root, files, bytes, findings }, null, 2));
if (findings.length > 0) process.exitCode = 1;
