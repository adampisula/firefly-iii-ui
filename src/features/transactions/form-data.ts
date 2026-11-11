import type { TransactionDraft, TransactionDraftJournal } from "./service";

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

function journalFromForm(
  formData: FormData,
  index: number,
): TransactionDraftJournal {
  const prefix = `journal_${index}_`;
  return {
    journalId: value(formData, `${prefix}journal_id`) || undefined,
    type: value(formData, `${prefix}type`),
    date: value(formData, `${prefix}date`),
    amount: value(formData, `${prefix}amount`).trim(),
    description: value(formData, `${prefix}description`),
    sourceId: value(formData, `${prefix}source_id`),
    destinationId: value(formData, `${prefix}destination_id`),
    currencyCode: value(formData, `${prefix}currency_code`),
    foreignAmount: value(formData, `${prefix}foreign_amount`).trim(),
    foreignCurrencyCode: value(formData, `${prefix}foreign_currency_code`),
    categoryId: value(formData, `${prefix}category_id`),
    budgetId: value(formData, `${prefix}budget_id`),
    billId: value(formData, `${prefix}bill_id`),
    tags: value(formData, `${prefix}tags`),
    notes: value(formData, `${prefix}notes`),
    internalReference: value(formData, `${prefix}internal_reference`),
    externalUrl: value(formData, `${prefix}external_url`),
    reconciled: checked(formData, `${prefix}reconciled`),
  };
}

export function draftFromForm(formData: FormData): TransactionDraft {
  const rawCount = Number(value(formData, "journal_count"));
  const count = Number.isInteger(rawCount)
    ? Math.min(100, Math.max(1, rawCount))
    : 1;
  return {
    groupTitle: value(formData, "group_title"),
    applyRules: checked(formData, "apply_rules"),
    fireWebhooks: checked(formData, "fire_webhooks"),
    errorIfDuplicate: checked(formData, "error_if_duplicate_hash"),
    journals: Array.from({ length: count }, (_, index) =>
      journalFromForm(formData, index),
    ),
  };
}
