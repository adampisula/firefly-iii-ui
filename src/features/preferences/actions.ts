"use server";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
export interface PreferenceActionState {
  ok: boolean;
  message: string;
  errors: Record<string, string>;
}
function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}
function checked(formData: FormData, key: string): boolean {
  const entry = formData.get(key);
  return entry === "on" || entry === "true";
}
export async function savePreferencesAction(
  _previous: PreferenceActionState,
  formData: FormData,
): Promise<PreferenceActionState> {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return {
      ok: false,
      message: "Connect a Firefly account first.",
      errors: {},
    };
  if (context.compatibility.status !== "verified")
    return {
      ok: false,
      message: "Preferences are blocked until compatibility is verified.",
      errors: {},
    };
  const updates: { name: string; data: unknown }[] = [
    { name: "locale", data: value(formData, "locale").trim() || "equal" },
    {
      name: "listPageSize",
      data: Number(value(formData, "listPageSize")) || 20,
    },
    { name: "viewRange", data: value(formData, "viewRange") },
    {
      name: "convert_to_primary",
      data: checked(formData, "convert_to_primary"),
    },
    { name: "customFiscalYear", data: checked(formData, "customFiscalYear") },
    { name: "fiscalYearStart", data: value(formData, "fiscalYearStart") },
    {
      name: "frontpageAccounts",
      data: formData
        .getAll("frontpageAccounts")
        .filter((item): item is string => typeof item === "string")
        .map((item) => Number(item))
        .filter((item) => Number.isSafeInteger(item)),
    },
    {
      name: "transaction_journal_optional_fields",
      data: {
        interest_date: checked(formData, "field_interest_date"),
        book_date: checked(formData, "field_book_date"),
        process_date: checked(formData, "field_process_date"),
        due_date: checked(formData, "field_due_date"),
        payment_date: checked(formData, "field_payment_date"),
        invoice_date: checked(formData, "field_invoice_date"),
        internal_reference: checked(formData, "field_internal_reference"),
        notes: checked(formData, "field_notes"),
        attachments: checked(formData, "field_attachments"),
      },
    },
  ];
  try {
    for (const update of updates)
      await context.client.request("preferences.store", { body: update });
    revalidatePath("/preferences");
    revalidatePath("/");
    return {
      ok: true,
      message: "Preferences saved through verified keys.",
      errors: {},
    };
  } catch (error) {
    if (error instanceof ApiClientError)
      return { ok: false, message: error.message, errors: {} };
    return {
      ok: false,
      message: "Preferences could not be saved.",
      errors: {},
    };
  }
}
