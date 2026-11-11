"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
import {
  recurrencePayload,
  validateRecurrenceDraft,
  type RecurrenceDraft,
} from "./service";

export interface RecurrenceActionState {
  ok: boolean;
  message: string;
  errors: Record<string, string>;
}
const INITIAL: RecurrenceActionState = { ok: false, message: "", errors: {} };
function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}
function checked(formData: FormData, key: string, fallback = false): boolean {
  const entry = formData.get(key);
  if (entry === null) return fallback;
  return entry === "on" || entry === "true";
}
function failure(error: unknown): RecurrenceActionState {
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
    message: "The recurrence change could not be completed.",
    errors: {},
  };
}
async function contextOrError(): Promise<
  | {
      context: Awaited<ReturnType<typeof getSessionApiContext>>;
      error?: undefined;
    }
  | { context?: undefined; error: RecurrenceActionState }
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
function draftFromForm(formData: FormData): RecurrenceDraft {
  return {
    type: value(formData, "type"),
    title: value(formData, "title"),
    description: value(formData, "description"),
    firstDate: value(formData, "first_date"),
    repeatUntil: value(formData, "repeat_until"),
    nrOfRepetitions: value(formData, "nr_of_repetitions"),
    applyRules: checked(formData, "apply_rules"),
    active: checked(formData, "active", true),
    notes: value(formData, "notes"),
    repType: value(formData, "rep_type"),
    repMoment: value(formData, "rep_moment"),
    repSkip: value(formData, "rep_skip"),
    descriptionTx: value(formData, "tx_description"),
    amount: value(formData, "tx_amount"),
    sourceId: value(formData, "tx_source_id"),
    destinationId: value(formData, "tx_destination_id"),
    currencyCode: value(formData, "tx_currency_code"),
  };
}
export async function saveRecurrenceAction(
  _previous: RecurrenceActionState,
  formData: FormData,
): Promise<RecurrenceActionState> {
  const id = value(formData, "recurrence_id");
  const draft = draftFromForm(formData);
  const validation = validateRecurrenceDraft(draft);
  if (!validation.ok)
    return {
      ok: false,
      message: "Check the recurrence fields.",
      errors: validation.errors,
    };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    if (id) {
      await context.client.request("recurrences.update", {
        pathParameters: { recurrence: id },
        body: recurrencePayload(draft),
      });
      revalidatePath(`/recurrences/${id}`);
      redirect(`/recurrences/${id}`);
    }
    const response = await context.client.request<{ data?: { id?: string } }>(
      "recurrences.store",
      { body: recurrencePayload(draft) },
    );
    const newId = response.data?.data?.id;
    revalidatePath("/recurrences");
    redirect(newId ? `/recurrences/${newId}` : "/recurrences");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
export async function deleteRecurrenceAction(
  _previous: RecurrenceActionState,
  formData: FormData,
): Promise<RecurrenceActionState> {
  const id = value(formData, "recurrence_id");
  if (!/^\d+$/.test(id))
    return { ok: false, message: "Invalid recurrence.", errors: {} };
  if (value(formData, "confirm_delete") !== "yes")
    return {
      ok: false,
      message: "Confirm the recurrence deletion.",
      errors: {},
    };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("recurrences.delete", {
      pathParameters: { recurrence: id },
    });
    revalidatePath("/recurrences");
    redirect("/recurrences");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
export async function triggerRecurrenceAction(
  _previous: RecurrenceActionState,
  formData: FormData,
): Promise<RecurrenceActionState> {
  const id = value(formData, "recurrence_id");
  const date = value(formData, "date");
  if (!/^\d+$/.test(id) || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return {
      ok: false,
      message: "Enter a valid recurrence and date.",
      errors: {},
    };
  if (value(formData, "confirm_trigger") !== "yes")
    return { ok: false, message: "Confirm recurrence execution.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("recurrences.trigger", {
      pathParameters: { recurrence: id },
      query: { date },
      body: {},
    });
    revalidatePath(`/recurrences/${id}`);
    return { ok: true, message: "Recurrence execution requested.", errors: {} };
  } catch (caught) {
    return failure(caught);
  }
}
