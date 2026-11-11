"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
import { transactionPayload, validateTransactionDraft } from "./service";
import { draftFromForm, value } from "./form-data";

export interface TransactionActionState {
  ok: boolean;
  message: string;
  errors: Record<string, string>;
}

function failure(error: unknown): TransactionActionState {
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
    message: "The transaction change could not be completed.",
    errors: {},
  };
}

async function contextOrError(): Promise<
  | {
      context: Awaited<ReturnType<typeof getSessionApiContext>>;
      error?: undefined;
    }
  | { context?: undefined; error: TransactionActionState }
> {
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return {
      error: {
        ok: false,
        message: "Connect a Firefly account before editing transactions.",
        errors: {},
      },
    };
  }
  if (context.compatibility.status !== "verified") {
    return {
      error: {
        ok: false,
        message:
          "Financial writes are blocked until compatibility is verified.",
        errors: {},
      },
    };
  }
  return { context };
}

export async function createTransactionAction(
  _previous: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const draft = draftFromForm(formData);
  const validation = validateTransactionDraft(draft);
  if (!validation.ok) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      errors: validation.errors,
    };
  }
  const { context, error } = await contextOrError();
  if (!context)
    return (
      error ?? {
        ok: false,
        message: "Connect a Firefly account before editing transactions.",
        errors: {},
      }
    );

  try {
    const response = await context.client.request<{
      data?: { id?: string };
    }>("transactions.store", { body: transactionPayload(draft) });
    revalidatePath("/transactions");
    const id = response.data?.data?.id;
    redirect(id ? `/transactions/${id}` : "/transactions");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}

export async function updateTransactionAction(
  _previous: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const groupId = value(formData, "group_id");
  if (!/^\d+$/.test(groupId)) {
    return { ok: false, message: "Invalid transaction group ID.", errors: {} };
  }
  const draft = draftFromForm(formData);
  if (draft.journals.some((journal) => journal.reconciled)) {
    return {
      ok: false,
      message:
        "Reconciled rows are protected from generic edits. Use the reconciliation workflow where supported.",
      errors: {},
    };
  }
  if (draft.journals.some((journal) => !journal.journalId)) {
    return {
      ok: false,
      message:
        "Every retained split must include its journal identity. Reload and try again.",
      errors: {},
    };
  }
  const validation = validateTransactionDraft(draft);
  if (!validation.ok) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      errors: validation.errors,
    };
  }
  const { context, error } = await contextOrError();
  if (!context)
    return (
      error ?? {
        ok: false,
        message: "Connect a Firefly account before editing transactions.",
        errors: {},
      }
    );

  try {
    await context.client.request("transactions.update", {
      pathParameters: { transactionGroup: groupId },
      body: transactionPayload(draft),
    });
    revalidatePath(`/transactions/${groupId}`);
    revalidatePath("/transactions");
    redirect(`/transactions/${groupId}`);
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}

export async function deleteTransactionAction(
  _previous: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const groupId = value(formData, "group_id");
  if (!/^\d+$/.test(groupId)) {
    return { ok: false, message: "Invalid transaction group ID.", errors: {} };
  }
  if (value(formData, "confirm_delete") !== "yes") {
    return {
      ok: false,
      message: "Confirm the transaction group deletion before continuing.",
      errors: {},
    };
  }
  const { context, error } = await contextOrError();
  if (!context)
    return (
      error ?? {
        ok: false,
        message: "Connect a Firefly account before editing transactions.",
        errors: {},
      }
    );
  try {
    await context.client.request("transactions.delete", {
      pathParameters: { transactionGroup: groupId },
    });
    revalidatePath("/transactions");
    redirect("/transactions");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}

export async function deleteJournalAction(
  _previous: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const journalId = value(formData, "journal_id");
  const groupId = value(formData, "group_id");
  if (!/^\d+$/.test(journalId) || !/^\d+$/.test(groupId)) {
    return { ok: false, message: "Invalid journal identity.", errors: {} };
  }
  if (value(formData, "confirm_delete") !== "yes") {
    return {
      ok: false,
      message: "Confirm the journal deletion before continuing.",
      errors: {},
    };
  }
  const { context, error } = await contextOrError();
  if (!context)
    return (
      error ?? {
        ok: false,
        message: "Connect a Firefly account before editing transactions.",
        errors: {},
      }
    );
  try {
    await context.client.request("transaction-journals.delete", {
      pathParameters: { transactionJournal: journalId },
    });
    revalidatePath(`/transactions/${groupId}`);
    revalidatePath("/transactions");
    redirect(`/transactions/${groupId}`);
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
