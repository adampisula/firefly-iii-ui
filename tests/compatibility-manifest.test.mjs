import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SUPPORTED_BACKEND_VERSION } from "../src/lib/api/compatibility.ts";

const manifest = JSON.parse(
  await readFile(
    new URL("../backend-compatibility.json", import.meta.url),
    "utf8",
  ),
);

test("runtime compatibility target stays aligned with the root manifest", () => {
  assert.equal(SUPPORTED_BACKEND_VERSION, manifest.backend.supportedVersion);
});
