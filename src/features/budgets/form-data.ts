import type { BudgetDraft, BudgetLimitDraft } from "./service";

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

export function budgetDraftFromForm(formData: FormData): BudgetDraft {
  return {
    name: value(formData, "name"),
    active: checked(formData, "active", true),
    order: value(formData, "order").trim(),
    notes: value(formData, "notes"),
    autoBudgetType: value(formData, "auto_budget_type") || "none",
    autoBudgetAmount: value(formData, "auto_budget_amount").trim(),
    autoBudgetPeriod: value(formData, "auto_budget_period"),
    currencyCode: value(formData, "auto_budget_currency_code"),
  };
}

export function limitDraftFromForm(formData: FormData): BudgetLimitDraft {
  return {
    start: value(formData, "start"),
    end: value(formData, "end"),
    amount: value(formData, "amount").trim(),
    currencyCode: value(formData, "currency_code"),
  };
}
