import assert from "node:assert/strict";
import test from "node:test";
import {
  displayDateValue,
  isoDateValue,
} from "../src/lib/finance/date-input.ts";
import { formatDisplayDate } from "../src/lib/finance/dates.ts";

test("display dates use dd/mm/yyyy", () => {
  assert.equal(formatDisplayDate("2026-11-19"), "19/11/2026");
  assert.equal(formatDisplayDate("2026-01-02T12:00:00Z"), "02/01/2026");
  assert.equal(formatDisplayDate(""), "Not reported");
});

test("date inputs round-trip dd/mm/yyyy and ISO", () => {
  assert.equal(displayDateValue("2027-01-02"), "02/01/2027");
  assert.equal(isoDateValue("02/01/2027"), "2027-01-02");
  assert.equal(isoDateValue("2/1/2027"), "2027-01-02");
  assert.equal(isoDateValue("31/02/2027"), "");
  assert.equal(isoDateValue("2027-01-02"), "");
  assert.equal(isoDateValue(""), "");
});
