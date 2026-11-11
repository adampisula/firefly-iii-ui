import type { PiggyDraft } from "./service";
export function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}
export function piggyDraftFromForm(formData: FormData): PiggyDraft {
  return {
    name: value(formData, "name"),
    targetAmount: value(formData, "target_amount").trim(),
    startDate: value(formData, "start_date"),
    targetDate: value(formData, "target_date"),
    order: value(formData, "order").trim(),
    notes: value(formData, "notes"),
    objectGroupTitle: value(formData, "object_group_title"),
    accountId: value(formData, "account_id"),
    currentAmount: value(formData, "current_amount").trim(),
    currencyCode: value(formData, "currency_code"),
  };
}
