import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const styles = await readFile(
  new URL("../src/components/ui/primitives.module.css", import.meta.url),
  "utf8",
);

test("glass primitives keep an opaque fallback without backdrop blur", () => {
  const fallback = styles.slice(0, styles.indexOf("@supports"));
  assert.match(
    fallback,
    /\.card\s*\{[^}]*background:\s*var\(--panel-opaque\)/s,
  );
  assert.match(
    fallback,
    /\.dialog\s*\{[^}]*background:\s*var\(--panel-opaque\)/s,
  );
  assert.match(styles, /@supports\s*\(backdrop-filter:\s*blur\(1px\)\)/);
});
