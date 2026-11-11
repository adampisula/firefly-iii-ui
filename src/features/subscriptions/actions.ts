"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
import { billPayload, validateBillDraft } from "./service";
import { billDraftFromForm, value } from "./form-data";

export interface BillActionState {
  ok: boolean;
  message: string;
  errors: Record<string, string>;
}

const INITIAL: BillActionState = { ok: false, message: "", errors: {} };

function failure(error: unknown): BillActionState {
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
    message: "The subscription change could not be completed.",
    errors: {},
  };
}

async function contextOrError(): Promise<
  | {
      context: Awaited<ReturnType<typeof getSessionApiContext>>;
      error?: undefined;
    }
  | { context?: undefined; error: BillActionState }
> {
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return {
      error: {
        ok: false,
        message: "Connect a Firefly account first.",
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

export async function saveBillAction(
  _previous: BillActionState,
  formData: FormData,
): Promise<BillActionState> {
  const id = value(formData, "bill_id");
  const draft = billDraftFromForm(formData);
  const validation = validateBillDraft(draft);
  if (!validation.ok) {
    return {
      ok: false,
      message: "Check the subscription fields.",
      errors: validation.errors,
    };
  }
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    if (id) {
      await context.client.request("bills.update", {
        pathParameters: { bill: id },
        body: billPayload(draft),
      });
      revalidatePath(`/subscriptions/${id}`);
    } else {
      const response = await context.client.request<{ data?: { id?: string } }>(
        "bills.store",
        { body: billPayload(draft) },
      );
      const newId = response.data?.data?.id;
      revalidatePath("/subscriptions");
      redirect(newId ? `/subscriptions/${newId}` : "/subscriptions");
    }
    revalidatePath("/subscriptions");
    redirect(`/subscriptions/${id}`);
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}

export async function deleteBillAction(
  _previous: BillActionState,
  formData: FormData,
): Promise<BillActionState> {
  const id = value(formData, "bill_id");
  if (!/^\d+$/.test(id))
    return { ok: false, message: "Invalid subscription.", errors: {} };
  if (value(formData, "confirm_delete") !== "yes") {
    return {
      ok: false,
      message: "Confirm the subscription deletion.",
      errors: {},
    };
  }
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("bills.delete", {
      pathParameters: { bill: id },
    });
    revalidatePath("/subscriptions");
    redirect("/subscriptions");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
