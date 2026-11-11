"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
export interface WebhookActionState {
  ok: boolean;
  message: string;
  errors: Record<string, string>;
}
const INITIAL: WebhookActionState = { ok: false, message: "", errors: {} };
function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}
function failure(error: unknown): WebhookActionState {
  if (error instanceof ApiClientError)
    return { ok: false, message: error.message, errors: {} };
  return {
    ok: false,
    message: "The webhook operation could not be completed.",
    errors: {},
  };
}
async function contextOrError(): Promise<
  | {
      context: Awaited<ReturnType<typeof getSessionApiContext>>;
      error?: undefined;
    }
  | { context?: undefined; error: WebhookActionState }
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
export async function createWebhookAction(
  _previous: WebhookActionState,
  formData: FormData,
): Promise<WebhookActionState> {
  const title = value(formData, "title").trim();
  const url = value(formData, "url").trim();
  const trigger = value(formData, "trigger");
  const response = value(formData, "response");
  const delivery = value(formData, "delivery");
  if (!title || !url || !trigger || !response || !delivery)
    return { ok: false, message: "Fill all webhook fields.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("webhooks.store", {
      body: {
        title,
        url,
        active: true,
        triggers: [trigger],
        responses: [response],
        deliveries: [delivery],
      },
    });
    revalidatePath("/webhooks");
    redirect("/webhooks");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
export async function deleteWebhookAction(
  _previous: WebhookActionState,
  formData: FormData,
): Promise<WebhookActionState> {
  const id = value(formData, "webhook_id");
  if (!/^\d+$/.test(id))
    return { ok: false, message: "Invalid webhook.", errors: {} };
  if (value(formData, "confirm_delete") !== "yes")
    return { ok: false, message: "Confirm the webhook deletion.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("webhooks.destroy", {
      pathParameters: { webhook: id },
    });
    revalidatePath("/webhooks");
    redirect("/webhooks");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
export async function submitWebhookAction(
  _previous: WebhookActionState,
  formData: FormData,
): Promise<WebhookActionState> {
  const id = value(formData, "webhook_id");
  if (!/^\d+$/.test(id))
    return { ok: false, message: "Invalid webhook.", errors: {} };
  if (value(formData, "confirm_submit") !== "yes")
    return { ok: false, message: "Confirm test delivery.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("webhooks.submit", {
      pathParameters: { webhook: id },
      body: {},
    });
    revalidatePath(`/webhooks/${id}`);
    return { ok: true, message: "Test delivery submitted.", errors: {} };
  } catch (caught) {
    return failure(caught);
  }
}
export { INITIAL };
