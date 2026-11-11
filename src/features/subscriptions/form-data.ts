import type { BillDraft } from "./service";

export function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}

export function checked(
  formData: FormData,
  key: string,
  fallback = false,
): boolean {
  const entry = formData.get(key);
  if (entry === null) return fallback;
  return entry === "on" || entry === "true";
}

export function billDraftFromForm(formData: FormData): BillDraft {
  return {
    name: value(formData, "name"),
    amountMin: value(formData, "amount_min").trim(),
    amountMax: value(formData, "amount_max").trim(),
    currencyCode: value(formData, "currency_code"),
    date: value(formData, "date"),
    endDate: value(formData, "end_date"),
    extensionDate: value(formData, "extension_date"),
    repeatFreq: value(formData, "repeat_freq"),
    skip: value(formData, "skip").trim(),
    active: checked(formData, "active", true),
    notes: value(formData, "notes"),
    objectGroupTitle: value(formData, "object_group_title"),
  };
}
