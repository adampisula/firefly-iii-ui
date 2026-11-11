import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(
  new URL("../src/styles/tokens.css", import.meta.url),
  "utf8",
);

test("design tokens use only the seven registered palette literals", () => {
  const colors = [...css.matchAll(/#[0-9a-fA-F]{6}/g)].map(([color]) =>
    color.toLowerCase(),
  );
  const registered = new Set([
    "#ffffff",
    "#f5f5f5",
    "#000000",
    "#8c8c8c",
    "#dbdbdb",
    "#137a50",
    "#6ee0a1",
  ]);

  assert.ok(colors.length >= registered.size);
  assert.ok(colors.every((color) => registered.has(color)));
  assert.ok([...registered].every((color) => colors.includes(color)));
});

test("themes and reduced-motion/transparency fallbacks are present", () => {
  assert.match(css, /\[data-theme="dark"\]/);
  assert.match(css, /prefers-color-scheme:\s*dark/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /prefers-reduced-transparency:\s*reduce/);
  assert.match(css, /--panel-blur:\s*0px/);
});

test("tokens do not add remote font or scene requests", () => {
  assert.doesNotMatch(css, /url\s*\(/i);
  assert.doesNotMatch(css, /https?:\/\//i);
});
