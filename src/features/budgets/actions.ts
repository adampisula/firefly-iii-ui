"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
import {
  budgetPayload,
  validateBudgetDraft,
  validateBudgetLimitDraft,
} from "./service";
import { budgetDraftFromForm, limitDraftFromForm, value } from "./form-data";

export interface BudgetActionState {
  ok: boolean;
  message: string;
  errors: Record<string, string>;
}

const INITIAL: BudgetActionState = { ok: false, message: "", errors: {} };

function failure(error: unknown): BudgetActionState {
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
    message: "The budget change could not be completed.",
    errors: {},
  };
}

async function contextOrError(): Promise<
  | {
      context: Awaited<ReturnType<typeof getSessionApiContext>>;
      error?: undefined;
    }
  | { context?: undefined; error: BudgetActionState }
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

export async function saveBudgetAction(
  _previous: BudgetActionState,
  formData: FormData,
): Promise<BudgetActionState> {
  const id = value(formData, "budget_id");
  const draft = budgetDraftFromForm(formData);
  const validation = validateBudgetDraft(draft);
  if (!validation.ok) {
    return {
      ok: false,
      message: "Check the budget fields.",
      errors: validation.errors,
    };
  }
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    if (id) {
      await context.client.request("budgets.update", {
        pathParameters: { budget: id },
        body: budgetPayload(draft),
      });
      revalidatePath(`/budgets/${id}`);
    } else {
      const response = await context.client.request<{ data?: { id?: string } }>(
        "budgets.store",
        { body: budgetPayload(draft) },
      );
      const newId = response.data?.data?.id;
      revalidatePath("/budgets");
      redirect(newId ? `/budgets/${newId}` : "/budgets");
    }
    revalidatePath("/budgets");
    redirect(`/budgets/${id}`);
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}

export async function deleteBudgetAction(
  _previous: BudgetActionState,
  formData: FormData,
): Promise<BudgetActionState> {
  const id = value(formData, "budget_id");
  if (!/^\d+$/.test(id))
    return { ok: false, message: "Invalid budget.", errors: {} };
  if (value(formData, "confirm_delete") !== "yes") {
    return { ok: false, message: "Confirm the budget deletion.", errors: {} };
  }
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("budgets.delete", {
      pathParameters: { budget: id },
    });
    revalidatePath("/budgets");
    redirect("/budgets");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}

export async function saveLimitAction(
  _previous: BudgetActionState,
  formData: FormData,
): Promise<BudgetActionState> {
  const budgetId = value(formData, "budget_id");
  const limitId = value(formData, "limit_id");
  if (!/^\d+$/.test(budgetId))
    return { ok: false, message: "Invalid budget.", errors: {} };
  const draft = limitDraftFromForm(formData);
  const validation = validateBudgetLimitDraft(draft);
  if (!validation.ok) {
    return {
      ok: false,
      message: "Check the limit fields.",
      errors: validation.errors,
    };
  }
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    const body = {
      start: draft.start,
      end: draft.end,
      amount: draft.amount,
      currency_code: draft.currencyCode,
    };
    if (limitId) {
      await context.client.request("budgets.limits.update", {
        pathParameters: { budget: budgetId, budgetLimit: limitId },
        body,
      });
    } else {
      await context.client.request("budgets.limits.store", {
        pathParameters: { budget: budgetId },
        body,
      });
    }
    revalidatePath(`/budgets/${budgetId}`);
    return { ok: true, message: "Budget limit saved.", errors: {} };
  } catch (caught) {
    return failure(caught);
  }
}

export async function deleteLimitAction(
  _previous: BudgetActionState,
  formData: FormData,
): Promise<BudgetActionState> {
  const budgetId = value(formData, "budget_id");
  const limitId = value(formData, "limit_id");
  if (!/^\d+$/.test(budgetId) || !/^\d+$/.test(limitId)) {
    return { ok: false, message: "Invalid limit identity.", errors: {} };
  }
  if (value(formData, "confirm_delete") !== "yes") {
    return { ok: false, message: "Confirm the limit deletion.", errors: {} };
  }
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("budgets.limits.delete", {
      pathParameters: { budget: budgetId, budgetLimit: limitId },
    });
    revalidatePath(`/budgets/${budgetId}`);
    return { ok: true, message: "Budget limit deleted.", errors: {} };
  } catch (caught) {
    return failure(caught);
  }
}
