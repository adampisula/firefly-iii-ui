import { formatMoney, type MoneyValue } from "../finance/decimal.ts";

export const UI_LANGUAGE = "en" as const;
export const DEFAULT_FORMAT_LOCALE = "en-US" as const;

export const englishMessages = {
  appTitle: "Firefly",
  loading: "Loading",
  emptyState: "There is nothing to show yet.",
  pageNotFound: "Page not found",
  pageNotFoundDescription: "The page you requested is not available.",
  loadFailure: "We could not load this page.",
  loadFailureDescription:
    "Your financial data has not been changed. Try loading the page again.",
  retry: "Try again",
  compatibilityMismatch:
    "This Firefly III installation is not verified as version 6.7.9. Financial access is unavailable until compatibility is verified.",
  requiredField: "This field is required.",
} as const;

export type EnglishMessageKey = keyof typeof englishMessages;

export function getEnglishMessage(key: EnglishMessageKey): string {
  return englishMessages[key];
}

export function resolveFormatLocale(preference?: string): string {
  if (!preference?.trim()) return DEFAULT_FORMAT_LOCALE;
  try {
    const [locale] = Intl.getCanonicalLocales(preference.trim());
    if (!locale || locale.toLowerCase() === "en") return DEFAULT_FORMAT_LOCALE;
    return locale.toLowerCase().startsWith("en-")
      ? locale
      : DEFAULT_FORMAT_LOCALE;
  } catch {
    return DEFAULT_FORMAT_LOCALE;
  }
}

export function formatEnglishMoney(
  value: MoneyValue,
  formatLocale?: string,
): string {
  return formatMoney(value, resolveFormatLocale(formatLocale));
}
