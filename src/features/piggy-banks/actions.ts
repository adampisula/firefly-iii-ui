"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
import { getPiggyBank, piggyPayload, validatePiggyDraft } from "./service";
import { piggyDraftFromForm, value } from "./form-data";

export interface PiggyActionState {
  ok: boolean;
  message: string;
  errors: Record<string, string>;
}
const INITIAL: PiggyActionState = { ok: false, message: "", errors: {} };
function failure(error: unknown): PiggyActionState {
  if (error instanceof ApiClientError)
    return {
      ok: false,
      message: error.message,
      errors: Object.fromEntries(
        error.fieldPaths.map((path) => [path, "Firefly rejected this field."]),
      ),
    };
  return {
    ok: false,
    message: "The savings-goal change could not be completed.",
    errors: {},
  };
}
async function contextOrError(): Promise<
  | {
      context: Awaited<ReturnType<typeof getSessionApiContext>>;
      error?: undefined;
    }
  | { context?: undefined; error: PiggyActionState }
> {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return {
      error: {
        ok: false,
        message: "Connect a Firefly account first.",
        errors: {},
      },
    };
  if (context.compatibility.status !== "verified")
    return {
      error: {
        ok: false,
        message:
          "Financial writes are blocked until compatibility is verified.",
        errors: {},
      },
    };
  return { context };
}
export async function savePiggyAction(
  _previous: PiggyActionState,
  formData: FormData,
): Promise<PiggyActionState> {
  const id = value(formData, "piggy_id");
  const draft = piggyDraftFromForm(formData);
  const validation = validatePiggyDraft(draft);
  if (!validation.ok)
    return {
      ok: false,
      message: "Check the savings-goal fields.",
      errors: validation.errors,
    };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    if (id) {
      const existing = await getPiggyBank(context.client, id);
      if (!existing)
        return {
          ok: false,
          message: "The savings goal no longer exists.",
          errors: {},
        };
      await context.client.request("piggy-banks.update", {
        pathParameters: { piggyBank: id },
        body: piggyPayload(draft, existing.accounts),
      });
      revalidatePath(`/piggy-banks/${id}`);
      redirect(`/piggy-banks/${id}`);
    }
    const response = await context.client.request<{ data?: { id?: string } }>(
      "piggy-banks.store",
      { body: piggyPayload(draft) },
    );
    const newId = response.data?.data?.id;
    revalidatePath("/piggy-banks");
    redirect(newId ? `/piggy-banks/${newId}` : "/piggy-banks");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
export async function deletePiggyAction(
  _previous: PiggyActionState,
  formData: FormData,
): Promise<PiggyActionState> {
  const id = value(formData, "piggy_id");
  if (!/^\d+$/.test(id))
    return { ok: false, message: "Invalid savings goal.", errors: {} };
  if (value(formData, "confirm_delete") !== "yes")
    return {
      ok: false,
      message: "Confirm the savings-goal deletion.",
      errors: {},
    };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("piggy-banks.delete", {
      pathParameters: { piggyBank: id },
    });
    revalidatePath("/piggy-banks");
    redirect("/piggy-banks");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
