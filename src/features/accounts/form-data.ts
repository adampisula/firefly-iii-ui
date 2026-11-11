import type { AccountDraft } from "./service";

export function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}

function checked(formData: FormData, key: string, fallback = false): boolean {
  const entry = formData.get(key);
  if (entry === null) return fallback;
  return entry === "on" || entry === "true";
}

export function draftFromForm(formData: FormData): AccountDraft {
  return {
    name: value(formData, "name"),
    type: value(formData, "type"),
    accountRole: value(formData, "account_role"),
    currencyCode: value(formData, "currency_code"),
    active: checked(formData, "active", true),
    includeNetWorth: checked(formData, "include_net_worth", true),
    openingBalance: value(formData, "opening_balance").trim(),
    openingBalanceDate: value(formData, "opening_balance_date"),
    virtualBalance: value(formData, "virtual_balance").trim(),
    iban: value(formData, "iban"),
    bic: value(formData, "bic"),
    accountNumber: value(formData, "account_number"),
    notes: value(formData, "notes"),
    creditCardType: value(formData, "credit_card_type"),
    monthlyPaymentDate: value(formData, "monthly_payment_date"),
    liabilityType: value(formData, "liability_type"),
    liabilityDirection: value(formData, "liability_direction"),
    liabilityAmount: value(formData, "liability_amount").trim(),
    liabilityStartDate: value(formData, "liability_start_date"),
    interest: value(formData, "interest").trim(),
    interestPeriod: value(formData, "interest_period"),
  };
}
