"use server";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
export interface MaintenanceState {
  ok: boolean;
  message: string;
}
function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}
async function contextOrError(): Promise<
  | {
      context: Awaited<ReturnType<typeof getSessionApiContext>>;
      error?: undefined;
    }
  | { context?: undefined; error: MaintenanceState }
> {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return {
      error: { ok: false, message: "Connect a Firefly account first." },
    };
  if (context.compatibility.status !== "verified")
    return {
      error: {
        ok: false,
        message: "Writes are blocked until compatibility is verified.",
      },
    };
  return { context };
}
export async function destroyDataAction(
  _previous: MaintenanceState,
  formData: FormData,
): Promise<MaintenanceState> {
  const objects = value(formData, "objects");
  const unused = value(formData, "unused") === "true";
  if (
    ![
      "budgets",
      "bills",
      "piggy_banks",
      "rules",
      "recurring",
      "categories",
      "tags",
      "object_groups",
    ].includes(objects)
  )
    return { ok: false, message: "Choose a supported data family." };
  if (value(formData, "confirm") !== "DELETE")
    return { ok: false, message: "Type DELETE to confirm." };
  const { context, error } = await contextOrError();
  if (!context) return error ?? { ok: false, message: "Blocked." };
  try {
    await context.client.request("data.destroy", {
      query: { objects, unused },
    });
    revalidatePath("/");
    return { ok: true, message: `Deletion requested for ${objects}.` };
  } catch (caught) {
    if (caught instanceof ApiClientError)
      return { ok: false, message: caught.message };
    return { ok: false, message: "Deletion failed." };
  }
}
export async function purgeDataAction(
  _previous: MaintenanceState,
  formData: FormData,
): Promise<MaintenanceState> {
  if (value(formData, "confirm") !== "PURGE")
    return { ok: false, message: "Type PURGE to confirm." };
  const { context, error } = await contextOrError();
  if (!context) return error ?? { ok: false, message: "Blocked." };
  try {
    await context.client.request("data.purge");
    return {
      ok: true,
      message: "Permanent purge of soft-deleted records requested.",
    };
  } catch (caught) {
    if (caught instanceof ApiClientError)
      return { ok: false, message: caught.message };
    return { ok: false, message: "Purge failed." };
  }
}
