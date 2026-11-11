"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
import {
  accountPayload,
  validateAccountDraft,
  type FieldErrors,
} from "./service";
import { draftFromForm, value } from "./form-data";

export interface AccountActionState {
  ok: boolean;
  message: string;
  errors: FieldErrors;
}

function failure(error: unknown): AccountActionState {
  if (error instanceof ApiClientError) {
    return {
      ok: false,
      message: error.message,
      errors: Object.fromEntries(
        error.fieldPaths.map((path) => [path, "Firefly rejected this field."]),
      ),
    };
  }
  return {
    ok: false,
    message: "The account change could not be completed.",
    errors: {},
  };
}

export async function createAccountAction(
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const draft = draftFromForm(formData);
  if (!draft.currencyCode) {
    return {
      ok: false,
      message: "Choose a currency.",
      errors: { currency_code: "Choose a currency." },
    };
  }
  const validation = validateAccountDraft(draft);
  if (!validation.ok) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      errors: validation.errors,
    };
  }

  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return {
      ok: false,
      message: "Connect a Firefly account before creating accounts.",
      errors: {},
    };
  }
  if (context.compatibility.status !== "verified") {
    return {
      ok: false,
      message: "Financial writes are blocked until compatibility is verified.",
      errors: {},
    };
  }

  try {
    const response = await context.client.request<{
      data?: { id?: string };
    }>("accounts.store", { body: accountPayload(draft) });
    const id = response.data?.data?.id;
    revalidatePath("/accounts");
    if (id) redirect(`/accounts/${id}`);
    redirect("/accounts");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT")
      throw error;
    return failure(error);
  }
}

export async function updateAccountAction(
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const id = value(formData, "account_id");
  if (!/^\d+$/.test(id)) {
    return { ok: false, message: "Invalid account ID.", errors: {} };
  }
  const draft = draftFromForm(formData);
  const validation = validateAccountDraft(draft);
  if (!validation.ok) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      errors: validation.errors,
    };
  }

  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return {
      ok: false,
      message: "Connect a Firefly account before editing accounts.",
      errors: {},
    };
  }
  if (context.compatibility.status !== "verified") {
    return {
      ok: false,
      message: "Financial writes are blocked until compatibility is verified.",
      errors: {},
    };
  }

  try {
    const payload = accountPayload(draft);
    delete payload.currency_code;
    await context.client.request("accounts.update", {
      pathParameters: { account: id },
      body: payload,
    });
    revalidatePath(`/accounts/${id}`);
    revalidatePath("/accounts");
    redirect(`/accounts/${id}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT")
      throw error;
    return failure(error);
  }
}

export async function deleteAccountAction(
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const id = value(formData, "account_id");
  if (!/^\d+$/.test(id)) {
    return { ok: false, message: "Invalid account ID.", errors: {} };
  }
  if (value(formData, "confirm_delete") !== "yes") {
    return {
      ok: false,
      message: "Confirm the permanent account deletion before continuing.",
      errors: {},
    };
  }
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return {
      ok: false,
      message: "Connect a Firefly account before deleting accounts.",
      errors: {},
    };
  }
  if (context.compatibility.status !== "verified") {
    return {
      ok: false,
      message: "Financial writes are blocked until compatibility is verified.",
      errors: {},
    };
  }
  try {
    await context.client.request("accounts.delete", {
      pathParameters: { account: id },
    });
    revalidatePath("/accounts");
    redirect("/accounts");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT")
      throw error;
    return failure(error);
  }
}
