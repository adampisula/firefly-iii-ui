import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { checkVersionContract } from "../scripts/check-version.mjs";

const compatibility = JSON.parse(
  await readFile(
    new URL("../backend-compatibility.json", import.meta.url),
    "utf8",
  ),
);
const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);

test("the planned frontend version matches the exact backend release", () => {
  assert.equal(checkVersionContract(packageJson.version, compatibility), true);
});

test("a frontend version that differs from the manifest fails", () => {
  assert.throws(
    () => checkVersionContract("6.7.9-frontend.0.1.1", compatibility),
    /must match frontend\.initialPlannedVersion/,
  );
});

test("a frontend version with a different backend prefix fails", () => {
  assert.throws(
    () => checkVersionContract("6.7.8-frontend.0.1.0", compatibility),
    /must match frontend\.initialPlannedVersion/,
  );
});
