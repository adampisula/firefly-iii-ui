"use server";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
export interface AdminState {
  ok: boolean;
  message: string;
}
export async function saveAdministrationAction(
  _previous: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const id =
    typeof formData.get("group_id") === "string"
      ? (formData.get("group_id") as string)
      : "";
  const title =
    typeof formData.get("title") === "string"
      ? (formData.get("title") as string).trim()
      : "";
  const currency =
    typeof formData.get("primary_currency_code") === "string"
      ? (formData.get("primary_currency_code") as string).toUpperCase()
      : "";
  if (!/^\d+$/.test(id) || !title || !/^[A-Z]{3}$/.test(currency))
    return { ok: false, message: "Enter a title and currency." };
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return { ok: false, message: "Connect a Firefly account first." };
  if (context.compatibility.status !== "verified")
    return {
      ok: false,
      message: "Writes are blocked until compatibility is verified.",
    };
  try {
    await context.client.request("user-groups.update", {
      pathParameters: { userGroup: id },
      body: { title, primary_currency_code: currency },
    });
    revalidatePath("/administration");
    revalidatePath("/");
    return { ok: true, message: "Administration saved." };
  } catch (error) {
    if (error instanceof ApiClientError)
      return { ok: false, message: error.message };
    return { ok: false, message: "Administration could not be saved." };
  }
}
