"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
import { ruleGroupPayload, rulePayload, validateRuleDraft } from "./service";
import type { RuleDraft } from "./service";

export interface RuleActionState {
  ok: boolean;
  message: string;
  errors: Record<string, string>;
}
const INITIAL: RuleActionState = { ok: false, message: "", errors: {} };
function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}
function checked(formData: FormData, key: string, fallback = false): boolean {
  const entry = formData.get(key);
  if (entry === null) return fallback;
  return entry === "on" || entry === "true";
}
function failure(error: unknown): RuleActionState {
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
    message: "The rule change could not be completed.",
    errors: {},
  };
}
async function contextOrError(): Promise<
  | {
      context: Awaited<ReturnType<typeof getSessionApiContext>>;
      error?: undefined;
    }
  | { context?: undefined; error: RuleActionState }
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
function draftFromForm(formData: FormData): RuleDraft {
  const triggerCount = Math.min(
    20,
    Math.max(1, Number(value(formData, "trigger_count")) || 1),
  );
  const actionCount = Math.min(
    20,
    Math.max(1, Number(value(formData, "action_count")) || 1),
  );
  const triggers = Array.from({ length: triggerCount }, (_, index) => ({
    type: value(formData, `trigger_${index}_type`),
    value: value(formData, `trigger_${index}_value`),
    active: checked(formData, `trigger_${index}_active`, true),
    stopProcessing: checked(formData, `trigger_${index}_stop`, false),
  }));
  const actions = Array.from({ length: actionCount }, (_, index) => ({
    type: value(formData, `action_${index}_type`),
    value: value(formData, `action_${index}_value`),
    active: checked(formData, `action_${index}_active`, true),
    stopProcessing: checked(formData, `action_${index}_stop`, false),
  }));
  return {
    title: value(formData, "title"),
    description: value(formData, "description"),
    ruleGroupId: value(formData, "rule_group_id"),
    trigger: value(formData, "trigger"),
    strict: checked(formData, "strict"),
    stopProcessing: checked(formData, "stop_processing"),
    active: checked(formData, "active", true),
    triggers,
    actions,
  };
}
export async function saveRuleAction(
  _previous: RuleActionState,
  formData: FormData,
): Promise<RuleActionState> {
  const id = value(formData, "rule_id");
  const draft = draftFromForm(formData);
  const validation = validateRuleDraft(draft);
  if (!validation.ok)
    return {
      ok: false,
      message: "Check the rule fields.",
      errors: validation.errors,
    };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    if (id) {
      await context.client.request("rules.update", {
        pathParameters: { rule: id },
        body: rulePayload(draft),
      });
      revalidatePath(`/rules/${id}`);
      redirect(`/rules/${id}`);
    }
    const response = await context.client.request<{ data?: { id?: string } }>(
      "rules.store",
      { body: rulePayload(draft) },
    );
    const newId = response.data?.data?.id;
    revalidatePath("/rules");
    redirect(newId ? `/rules/${newId}` : "/rules");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
export async function deleteRuleAction(
  _previous: RuleActionState,
  formData: FormData,
): Promise<RuleActionState> {
  const id = value(formData, "rule_id");
  if (!/^\d+$/.test(id))
    return { ok: false, message: "Invalid rule.", errors: {} };
  if (value(formData, "confirm_delete") !== "yes")
    return { ok: false, message: "Confirm the rule deletion.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("rules.delete", {
      pathParameters: { rule: id },
    });
    revalidatePath("/rules");
    redirect("/rules");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
export async function saveRuleGroupAction(
  _previous: RuleActionState,
  formData: FormData,
): Promise<RuleActionState> {
  const id = value(formData, "group_id");
  const title = value(formData, "title").trim();
  const description = value(formData, "description");
  const order = value(formData, "order").trim();
  const active = checked(formData, "active", true);
  if (!title) return { ok: false, message: "Enter a group title.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    const body = ruleGroupPayload(title, description, active, order);
    if (id) {
      await context.client.request("rule-groups.update", {
        pathParameters: { ruleGroup: id },
        body,
      });
      revalidatePath("/rules");
      return { ok: true, message: "Rule group saved.", errors: {} };
    }
    const response = await context.client.request<{ data?: { id?: string } }>(
      "rule-groups.store",
      { body },
    );
    revalidatePath("/rules");
    return {
      ok: true,
      message: `Rule group created (ID ${response.data?.data?.id ?? "unknown"}).`,
      errors: {},
    };
  } catch (caught) {
    return failure(caught);
  }
}
export async function deleteRuleGroupAction(
  _previous: RuleActionState,
  formData: FormData,
): Promise<RuleActionState> {
  const id = value(formData, "group_id");
  if (!/^\d+$/.test(id))
    return { ok: false, message: "Invalid rule group.", errors: {} };
  if (value(formData, "confirm_delete") !== "yes")
    return { ok: false, message: "Confirm the group deletion.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("rule-groups.delete", {
      pathParameters: { ruleGroup: id },
    });
    revalidatePath("/rules");
    redirect("/rules");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
export async function testRuleAction(
  _previous: RuleActionState,
  formData: FormData,
): Promise<RuleActionState> {
  const id = value(formData, "rule_id");
  if (!/^\d+$/.test(id))
    return { ok: false, message: "Invalid rule.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    const r = await context.client.request<{ data?: unknown[] }>("rules.test", {
      pathParameters: { rule: id },
    });
    return {
      ok: true,
      message: `Test completed; ${r.data?.data?.length ?? 0} matching transaction(s) reported.`,
      errors: {},
    };
  } catch (caught) {
    return failure(caught);
  }
}
export async function triggerRuleAction(
  _previous: RuleActionState,
  formData: FormData,
): Promise<RuleActionState> {
  const id = value(formData, "rule_id");
  if (!/^\d+$/.test(id))
    return { ok: false, message: "Invalid rule.", errors: {} };
  if (value(formData, "confirm_trigger") !== "yes")
    return { ok: false, message: "Confirm rule execution.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("rules.trigger", {
      pathParameters: { rule: id },
      body: {},
    });
    return { ok: true, message: "Rule execution requested.", errors: {} };
  } catch (caught) {
    return failure(caught);
  }
}
export async function validateExpressionAction(
  _previous: RuleActionState,
  formData: FormData,
): Promise<RuleActionState> {
  const expression = value(formData, "expression");
  if (!expression)
    return { ok: false, message: "Enter an expression.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    const r = await context.client.request<{ valid?: boolean; error?: string }>(
      "rules.validate",
      { query: { expression } },
    );
    return {
      ok: true,
      message:
        r.data?.valid === false
          ? (r.data?.error ?? "Expression is invalid.")
          : "Expression is valid.",
      errors: {},
    };
  } catch (caught) {
    return failure(caught);
  }
}
