import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

process.env.FRONTEND_PUBLIC_URL = "https://frontend.example.test";
process.env.BACKEND_PUBLIC_URL = "https://backend.example.test";
process.env.BACKEND_INTERNAL_API_URL = "http://firefly.internal/api/v1";
process.env.FRONTEND_DATA_DIR = await mkdtemp(
  path.join(tmpdir(), "firefly-appearance-"),
);

const {
  deleteAppearance,
  deleteBackground,
  readAppearance,
  readBackground,
  writeAppearance,
  writeBackground,
} = await import("../src/lib/appearance/server-store.ts");
const { DEFAULT_APPEARANCE } = await import("../src/lib/appearance.ts");

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32, 0),
]);

test("appearance storage is per user and preserves background metadata", async () => {
  const first = await readAppearance("user-one");
  assert.equal(first.exists, false);

  const saved = await writeAppearance("user-one", {
    ...DEFAULT_APPEARANCE,
    theme: "dark",
    accent: { mode: "preset", value: "blue" },
  });
  assert.equal(saved.theme, "dark");

  const uploaded = await writeBackground("user-one", "image/png", png);
  assert.equal(uploaded.background.mime, "image/png");
  assert.match(uploaded.background.url ?? "", /^\/api\/appearance\/background/);

  const changed = await writeAppearance("user-one", {
    ...uploaded,
    theme: "light",
  });
  assert.equal(changed.background.hasImage, true);

  const image = await readBackground("user-one");
  assert.equal(image?.mime, "image/png");
  assert.equal(image?.buffer.length, png.length);

  const other = await readAppearance("user-two");
  assert.equal(other.exists, false);
  assert.equal(other.settings.background.hasImage, false);

  const removed = await deleteBackground("user-one");
  assert.equal(removed.background.hasImage, false);
  assert.equal(await readBackground("user-one"), null);

  await deleteAppearance("user-one");
  const deleted = await readAppearance("user-one");
  assert.equal(deleted.exists, false);
});

test("appearance storage rejects unsafe accents and file types", async () => {
  await assert.rejects(
    writeAppearance("user-three", {
      ...DEFAULT_APPEARANCE,
      accent: { mode: "custom", value: "#ffff00" },
    }),
    /light/i,
  );
  await assert.rejects(
    writeBackground("user-three", "image/svg+xml", Buffer.from("<svg/>")),
    /JPEG|PNG|WebP/i,
  );
  await assert.rejects(
    writeBackground("user-three", "image/png", Buffer.from("not a png")),
    /valid/i,
  );
});

test.after(async () => {
  await rm(process.env.FRONTEND_DATA_DIR, { recursive: true, force: true });
});
