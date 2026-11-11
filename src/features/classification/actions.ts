"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";

export interface ClassActionState {
  ok: boolean;
  message: string;
  errors: Record<string, string>;
}
const INITIAL: ClassActionState = { ok: false, message: "", errors: {} };
function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}
function failure(error: unknown): ClassActionState {
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
    message: "The classification change could not be completed.",
    errors: {},
  };
}
async function contextOrError(): Promise<
  | {
      context: Awaited<ReturnType<typeof getSessionApiContext>>;
      error?: undefined;
    }
  | { context?: undefined; error: ClassActionState }
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
export async function saveCategoryAction(
  _previous: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const id = value(formData, "category_id");
  const name = value(formData, "name").trim();
  const notes = value(formData, "notes");
  if (!name)
    return { ok: false, message: "Enter a category name.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    const body = { name, ...(notes ? { notes } : {}) };
    if (id) {
      await context.client.request("categories.update", {
        pathParameters: { category: id },
        body,
      });
      revalidatePath(`/categories/${id}`);
      redirect(`/categories/${id}`);
    }
    const response = await context.client.request<{ data?: { id?: string } }>(
      "categories.store",
      { body },
    );
    const newId = response.data?.data?.id;
    revalidatePath("/categories");
    redirect(newId ? `/categories/${newId}` : "/categories");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
export async function deleteCategoryAction(
  _previous: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const id = value(formData, "category_id");
  if (!/^\d+$/.test(id))
    return { ok: false, message: "Invalid category.", errors: {} };
  if (value(formData, "confirm_delete") !== "yes")
    return { ok: false, message: "Confirm the category deletion.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("categories.delete", {
      pathParameters: { category: id },
    });
    revalidatePath("/categories");
    redirect("/categories");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
export async function saveTagAction(
  _previous: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const id = value(formData, "tag_id");
  const original = value(formData, "original_tag");
  const tag = value(formData, "tag").trim();
  const description = value(formData, "description");
  if (!tag) return { ok: false, message: "Enter a tag name.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    const body = { tag, ...(description ? { description } : {}) };
    if (id) {
      await context.client.request("tags.update", {
        pathParameters: { tagOrId: original || id },
        body,
      });
      revalidatePath("/tags");
      redirect(`/tags/${encodeURIComponent(tag)}`);
    }
    const response = await context.client.request<{
      data?: { attributes?: { tag?: string } };
    }>("tags.store", { body });
    const newTag = response.data?.data?.attributes?.tag ?? tag;
    revalidatePath("/tags");
    redirect(`/tags/${encodeURIComponent(newTag)}`);
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
export async function deleteTagAction(
  _previous: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const id = value(formData, "tag_id");
  const tag = value(formData, "tag");
  if (!id && !tag) return { ok: false, message: "Invalid tag.", errors: {} };
  if (value(formData, "confirm_delete") !== "yes")
    return { ok: false, message: "Confirm the tag deletion.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("tags.delete", {
      pathParameters: { tagOrId: tag || id },
    });
    revalidatePath("/tags");
    redirect("/tags");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
export async function saveObjectGroupAction(
  _previous: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const id = value(formData, "group_id");
  const title = value(formData, "title").trim();
  const order = value(formData, "order").trim();
  if (!/^\d+$/.test(id) || !title)
    return { ok: false, message: "Enter a group title.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("object-groups.update", {
      pathParameters: { objectGroup: id },
      body: { title, ...(order ? { order: Number(order) } : {}) },
    });
    revalidatePath(`/object-groups/${id}`);
    return { ok: true, message: "Object group saved.", errors: {} };
  } catch (caught) {
    return failure(caught);
  }
}
export async function deleteObjectGroupAction(
  _previous: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const id = value(formData, "group_id");
  if (!/^\d+$/.test(id))
    return { ok: false, message: "Invalid object group.", errors: {} };
  if (value(formData, "confirm_delete") !== "yes")
    return { ok: false, message: "Confirm the group deletion.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("object-groups.delete", {
      pathParameters: { objectGroup: id },
    });
    revalidatePath("/object-groups");
    redirect("/object-groups");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
