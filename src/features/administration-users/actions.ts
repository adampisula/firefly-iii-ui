"use server";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
export interface UserAdminState {
  ok: boolean;
  message: string;
}
function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}
async function ctx() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return {
      error: { ok: false, message: "Connect a Firefly account first." },
    } as const;
  if (context.compatibility.status !== "verified")
    return {
      error: {
        ok: false,
        message: "Writes are blocked until compatibility is verified.",
      },
    } as const;
  return { context } as const;
}
function fail(error: unknown): UserAdminState {
  if (error instanceof ApiClientError)
    return { ok: false, message: error.message };
  return { ok: false, message: "The user operation could not be completed." };
}
export async function saveUserAction(
  _previous: UserAdminState,
  formData: FormData,
): Promise<UserAdminState> {
  const id = value(formData, "user_id");
  const email = value(formData, "email").trim();
  const role = value(formData, "role");
  const blocked = value(formData, "blocked") === "true";
  if (!email || !/^[^@\s]+@[^@\s]+$/.test(email))
    return { ok: false, message: "Enter a valid email." };
  const { context, error } = await ctx();
  if (!context) return error ?? { ok: false, message: "Blocked." };
  try {
    if (id)
      await context.client.request("users.update", {
        pathParameters: { user: id },
        body: { email, role, blocked },
      });
    else
      await context.client.request("users.store", {
        body: { email, role, blocked },
      });
    revalidatePath("/admin/users");
    return { ok: true, message: "User saved." };
  } catch (caught) {
    return fail(caught);
  }
}
export async function deleteUserAction(
  _previous: UserAdminState,
  formData: FormData,
): Promise<UserAdminState> {
  const id = value(formData, "user_id");
  if (!/^\d+$/.test(id)) return { ok: false, message: "Invalid user." };
  if (value(formData, "confirm_delete") !== "yes")
    return { ok: false, message: "Confirm user deletion." };
  const { context, error } = await ctx();
  if (!context) return error ?? { ok: false, message: "Blocked." };
  try {
    await context.client.request("users.delete", {
      pathParameters: { user: id },
    });
    revalidatePath("/admin/users");
    return { ok: true, message: "User deleted." };
  } catch (caught) {
    return fail(caught);
  }
}
export async function saveConfigAction(
  _previous: UserAdminState,
  formData: FormData,
): Promise<UserAdminState> {
  const key = value(formData, "key").trim();
  const configValue = value(formData, "value");
  if (!key) return { ok: false, message: "Enter a configuration key." };
  const { context, error } = await ctx();
  if (!context) return error ?? { ok: false, message: "Blocked." };
  try {
    await context.client.request("configuration.update", {
      pathParameters: { dynamicConfigKey: key },
      body: { value: configValue },
    });
    revalidatePath("/admin/users");
    return { ok: true, message: "Configuration saved." };
  } catch (caught) {
    return fail(caught);
  }
}
