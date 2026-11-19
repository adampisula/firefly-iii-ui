import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCENT_PRESETS,
  contrastRatio,
  parseAppearance,
  readableInk,
  resolveAccent,
  validateAccent,
} from "../src/lib/appearance.ts";
import {
  summaryByKind,
  summaryEntries,
} from "../src/features/overview/service.ts";
import { mapSummary } from "../src/features/analysis/service.ts";

test("overview summary entries preserve currencies and kinds", () => {
  const summary = {
    "net-worth-in-EUR": {
      value: "1000.00",
      currencyCode: "EUR",
      decimalPlaces: 2,
    },
    "spent-in-USD": {
      value: "12.345",
      currencyCode: "USD",
      decimalPlaces: 3,
    },
    "left-to-spend-in-EUR": {
      value: "250.00",
      currencyCode: "EUR",
      decimalPlaces: 2,
    },
  };
  const entries = summaryEntries(summary);
  assert.equal(entries.length, 3);
  assert.equal(summaryByKind(summary, "spent")[0]?.currencyCode, "USD");
  assert.equal(summaryByKind(summary, "net-worth")[0]?.key, "net-worth-in-EUR");
  assert.deepEqual(summaryByKind(summary, "missing"), []);
});

test("summary mapping reads monetary_value in keyed data objects", () => {
  const mapped = mapSummary({
    data: {
      "balance-in-EUR": {
        monetary_value: "42.10",
        currency_code: "EUR",
        currency_decimal_places: 2,
        title: "Balance",
      },
    },
  });
  assert.equal(mapped["balance-in-EUR"]?.value, "42.10");
  assert.equal(mapped["balance-in-EUR"]?.title, "Balance");
});

test("accent presets keep readable text contrast in both themes", () => {
  for (const preset of ACCENT_PRESETS) {
    assert.ok(
      contrastRatio(preset.light, readableInk(preset.light)) >= 4.5,
      `${preset.id} light contrast`,
    );
    assert.ok(
      contrastRatio(preset.dark, readableInk(preset.dark)) >= 4.5,
      `${preset.id} dark contrast`,
    );
    assert.equal(validateAccent({ mode: "preset", value: preset.id }), null);
  }
});

test("custom accents reject unreadable colors and resolve per theme", () => {
  assert.match(validateAccent({ mode: "custom", value: "#fff" }) ?? "", /hex/i);
  assert.match(
    validateAccent({ mode: "custom", value: "#ffff00" }) ?? "",
    /light/i,
  );
  assert.equal(validateAccent({ mode: "custom", value: "#1e40af" }), null);
  assert.equal(
    resolveAccent({ mode: "custom", value: "#1e40af" }, "light"),
    "#1e40af",
  );
  assert.notEqual(
    resolveAccent({ mode: "custom", value: "#1e40af" }, "dark"),
    "#1e40af",
  );
});

test("stored appearance ignores unsafe background URLs", () => {
  const parsed = parseAppearance(
    JSON.stringify({
      accent: { mode: "preset", value: "blue" },
      background: {
        hasImage: true,
        url: "https://evil.example/background.jpg",
      },
    }),
  );
  assert.equal(parsed.background.hasImage, false);
  assert.equal(parsed.background.url, null);
  assert.deepEqual(parsed.accent, { mode: "preset", value: "blue" });
});
