import type { FinancialDate } from "../contracts.ts";

export interface InclusiveDateRange {
  start: string;
  end: string;
}

function assertDateOnly(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError("Date-only values must use YYYY-MM-DD format.");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new RangeError("Date-only value is not a calendar date.");
  }
}

export function validateInclusiveDateRange(
  start: string,
  end: string,
): InclusiveDateRange {
  assertDateOnly(start);
  assertDateOnly(end);
  if (start > end)
    throw new RangeError("Date range start must be on or before its end.");
  return { start, end };
}

export function formatDisplayDate(value: string): string {
  const dateOnly = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return "Not reported";
  assertDateOnly(dateOnly);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateOnly}T00:00:00.000Z`));
}

export function formatDateOnly(value: string, locale: string): string {
  assertDateOnly(value);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function formatTimestamp(
  value: string,
  timeZone: string,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()))
    throw new RangeError("Timestamp is invalid.");
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
}

export function dateOnlyInTimeZone(value: string, timeZone: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()))
    throw new RangeError("Timestamp is invalid.");
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(date);
  const fields = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${fields.year}-${fields.month}-${fields.day}`;
}

export function fiscalYearRange(
  date: string,
  startMonth: number,
): InclusiveDateRange {
  assertDateOnly(date);
  if (!Number.isInteger(startMonth) || startMonth < 1 || startMonth > 12) {
    throw new RangeError("Fiscal year start month must be between 1 and 12.");
  }

  const [year, month] = date.split("-").map(Number);
  const startYear = month >= startMonth ? year : year - 1;
  const start = `${startYear}-${String(startMonth).padStart(2, "0")}-01`;
  const endDate = new Date(Date.UTC(startYear + 1, startMonth - 1, 0));
  const end = endDate.toISOString().slice(0, 10);
  return { start, end };
}

export function toDateOnly(value: string): FinancialDate {
  assertDateOnly(value);
  return { kind: "date-only", value };
}
