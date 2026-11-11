import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_FORMAT_LOCALE,
  formatEnglishMoney,
  getEnglishMessage,
  resolveFormatLocale,
  UI_LANGUAGE,
} from "../src/lib/i18n/messages.ts";

test("UI language is fixed to English", () => {
  assert.equal(UI_LANGUAGE, "en");
});

test("English message catalog returns stable strings", () => {
  assert.equal(getEnglishMessage("appTitle"), "Firefly");
  assert.equal(getEnglishMessage("pageNotFound"), "Page not found");
  assert.equal(getEnglishMessage("retry"), "Try again");
  assert.match(getEnglishMessage("compatibilityMismatch"), /6\.7\.9/);
});

test("resolveFormatLocale defaults to en-US and canonicalizes English regional locales", () => {
  assert.equal(resolveFormatLocale(), DEFAULT_FORMAT_LOCALE);
  assert.equal(resolveFormatLocale(""), DEFAULT_FORMAT_LOCALE);
  assert.equal(resolveFormatLocale("   "), DEFAULT_FORMAT_LOCALE);
  assert.equal(resolveFormatLocale("en"), DEFAULT_FORMAT_LOCALE);
  assert.equal(resolveFormatLocale("en-us"), "en-US");
  assert.equal(resolveFormatLocale("en-gb"), "en-GB");
  assert.equal(resolveFormatLocale("en-ca"), "en-CA");
  assert.equal(resolveFormatLocale("en-AU"), "en-AU");
});

test("resolveFormatLocale safely falls back to en-US for non-English or invalid preferences", () => {
  assert.equal(resolveFormatLocale("nl-NL"), DEFAULT_FORMAT_LOCALE);
  assert.equal(resolveFormatLocale("de_DE"), DEFAULT_FORMAT_LOCALE);
  assert.equal(resolveFormatLocale("fr"), DEFAULT_FORMAT_LOCALE);
  assert.equal(
    resolveFormatLocale("invalid_locale_xyz"),
    DEFAULT_FORMAT_LOCALE,
  );
  assert.equal(resolveFormatLocale("!@#$%"), DEFAULT_FORMAT_LOCALE);
});

test("formatEnglishMoney formats zero, two, three decimal places and large numbers across English regions", () => {
  // 0 decimal places (JPY)
  const jpy = { amount: "1500", code: "JPY", decimalPlaces: 0 };
  assert.match(formatEnglishMoney(jpy, "en-US"), /1,500/);
  assert.match(formatEnglishMoney(jpy, "en-GB"), /1,500/);

  // 2 decimal places (USD, EUR, GBP)
  const usd = { amount: "1234.56", code: "USD", decimalPlaces: 2 };
  assert.match(formatEnglishMoney(usd, "en-US"), /1,234\.56/);

  const gbp = { amount: "1234.56", code: "GBP", decimalPlaces: 2 };
  assert.match(formatEnglishMoney(gbp, "en-GB"), /1,234\.56/);

  // 3 decimal places (BHD / KWD)
  const kwd = { amount: "1234.567", code: "KWD", decimalPlaces: 3 };
  assert.match(formatEnglishMoney(kwd, "en-US"), /1,234\.567/);

  // Huge amount
  const huge = {
    amount: "1000000000000.00",
    code: "EUR",
    decimalPlaces: 2,
  };
  assert.match(formatEnglishMoney(huge, "en-US"), /1,000,000,000,000\.00/);
});

test("formatEnglishMoney falls back to en-US format for unsupported non-English preference", () => {
  const eur = { amount: "1234.56", code: "EUR", decimalPlaces: 2 };
  // en-US uses comma for thousands, period for decimal point
  const formatted = formatEnglishMoney(eur, "de-DE");
  assert.match(formatted, /1,234\.56/);
});
