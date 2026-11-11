export interface CurrencyPrecision {
  code: string;
  decimalPlaces: number;
}

export interface MoneyValue extends CurrencyPrecision {
  amount: string;
}

function validatePlaces(decimalPlaces: number): void {
  if (
    !Number.isInteger(decimalPlaces) ||
    decimalPlaces < 0 ||
    decimalPlaces > 100
  ) {
    throw new RangeError(
      "Currency decimal places must be an integer from 0 to 100.",
    );
  }
}

function decimalParts(value: string): {
  negative: boolean;
  whole: string;
  fraction: string;
} {
  const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))$/.exec(value.trim());
  if (!match) throw new TypeError("Enter a valid decimal amount.");

  return {
    negative: match[1] === "-",
    whole: match[2] || "0",
    fraction: match[3] ?? match[4] ?? "",
  };
}

export function decimalToUnits(value: string, decimalPlaces: number): bigint {
  validatePlaces(decimalPlaces);
  const { negative, whole, fraction } = decimalParts(value);
  if (fraction.length > decimalPlaces) {
    throw new RangeError(
      `Amount has more than ${decimalPlaces} decimal places.`,
    );
  }
  const scale = 10n ** BigInt(decimalPlaces);
  const units =
    BigInt(whole) * scale + BigInt(fraction.padEnd(decimalPlaces, "0") || "0");
  return negative ? -units : units;
}

export function unitsToDecimal(units: bigint, decimalPlaces: number): string {
  validatePlaces(decimalPlaces);
  const negative = units < 0n;
  const absolute = negative ? -units : units;
  const scale = 10n ** BigInt(decimalPlaces);
  const whole = absolute / scale;
  if (decimalPlaces === 0) return `${negative ? "-" : ""}${whole}`;
  const fraction = String(absolute % scale).padStart(decimalPlaces, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

export function normalizeDecimal(value: string, decimalPlaces: number): string {
  return unitsToDecimal(decimalToUnits(value, decimalPlaces), decimalPlaces);
}

export function sumMoney(values: readonly MoneyValue[]): MoneyValue {
  if (values.length === 0)
    throw new RangeError("At least one money value is required.");
  const { code, decimalPlaces } = values[0];
  let total = 0n;

  for (const value of values) {
    if (value.code !== code || value.decimalPlaces !== decimalPlaces) {
      throw new TypeError(
        "Money values must use the same currency and precision.",
      );
    }
    total += decimalToUnits(value.amount, decimalPlaces);
  }

  return { code, decimalPlaces, amount: unitsToDecimal(total, decimalPlaces) };
}

function localizedDigits(locale: string): Map<string, string> {
  const formatter = new Intl.NumberFormat(locale, { useGrouping: false });
  return new Map(
    Array.from({ length: 10 }, (_, digit) => [
      formatter.format(BigInt(digit)),
      String(digit),
    ]),
  );
}

export function parseLocalizedDecimal(
  input: string,
  locale: string,
  decimalPlaces: number,
): string {
  validatePlaces(decimalPlaces);
  const integerFormatter = new Intl.NumberFormat(locale, {
    useGrouping: true,
    maximumFractionDigits: 0,
  });
  const groupParts =
    integerFormatter.formatToParts(123456789012345678901234567890n);
  const group = groupParts.find((part) => part.type === "group")?.value;
  const groupWidths = groupParts
    .filter((part) => part.type === "integer")
    .map((part) => [...part.value].length)
    .reverse();
  const decimalFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
  });
  const decimal =
    decimalFormatter.formatToParts(1n).find((part) => part.type === "decimal")
      ?.value ?? ".";
  const minus =
    integerFormatter
      .formatToParts(-1n)
      .find((part) => part.type === "minusSign")?.value ?? "-";
  const digits = localizedDigits(locale);

  let normalized = input.trim();
  for (const [localized, ascii] of digits)
    normalized = normalized.replaceAll(localized, ascii);
  let sign = "";
  if (normalized.startsWith(minus)) {
    sign = "-";
    normalized = normalized.slice(minus.length);
  } else if (normalized.startsWith("+")) {
    normalized = normalized.slice(1);
  }

  const decimalParts = normalized.split(decimal);
  if (decimalParts.length > 2)
    throw new TypeError("Enter a valid decimal amount.");
  let whole = decimalParts[0];
  const fraction = decimalParts[1] ?? "";

  if (group && whole.includes(group)) {
    const groups = whole.split(group);
    if (groups.some((part) => !/^\d+$/.test(part))) {
      throw new TypeError("Enter a valid decimal amount.");
    }
    for (let offset = 0; offset < groups.length - 1; offset += 1) {
      const expectedWidth =
        groupWidths[Math.min(offset, groupWidths.length - 1)];
      const actualWidth = [...groups[groups.length - 1 - offset]].length;
      if (actualWidth !== expectedWidth)
        throw new TypeError("Enter a valid decimal amount.");
    }
    const firstWidth =
      groupWidths[Math.min(groups.length - 1, groupWidths.length - 1)];
    if ([...groups[0]].length < 1 || [...groups[0]].length > firstWidth) {
      throw new TypeError("Enter a valid decimal amount.");
    }
    whole = groups.join("");
  }

  if (
    !/^\d*$/.test(whole) ||
    !/^\d*$/.test(fraction) ||
    (!whole && !fraction)
  ) {
    throw new TypeError("Enter a valid decimal amount.");
  }
  return normalizeDecimal(
    `${sign}${whole || "0"}${decimalParts.length === 2 ? `.${fraction}` : ""}`,
    decimalPlaces,
  );
}

export function formatMoney(value: MoneyValue, locale: string): string {
  validatePlaces(value.decimalPlaces);
  if (!/^[A-Z]{3}$/.test(value.code))
    throw new TypeError("Currency code must be a three-letter ISO code.");

  const units = decimalToUnits(value.amount, value.decimalPlaces);
  const negative = units < 0n;
  const absolute = negative ? -units : units;
  const scale = 10n ** BigInt(value.decimalPlaces);
  const whole = absolute / scale;
  const fraction =
    value.decimalPlaces === 0
      ? ""
      : String(absolute % scale).padStart(value.decimalPlaces, "0");
  const currencyFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: value.code,
    minimumFractionDigits: value.decimalPlaces,
    maximumFractionDigits: value.decimalPlaces,
  });
  const template = currencyFormatter.formatToParts(negative ? -1n : 1n);
  const integerParts = new Intl.NumberFormat(locale, {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).formatToParts(whole);
  let integerWritten = false;

  return template
    .map((part) => {
      if (part.type === "integer" || part.type === "group") {
        if (integerWritten) return "";
        integerWritten = true;
        return integerParts.map((integerPart) => integerPart.value).join("");
      }
      if (part.type === "fraction") return fraction;
      return part.value;
    })
    .join("");
}
