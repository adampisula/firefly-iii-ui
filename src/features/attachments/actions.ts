"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";

export interface AttachmentActionState {
  ok: boolean;
  message: string;
  errors: Record<string, string>;
}
const INITIAL: AttachmentActionState = { ok: false, message: "", errors: {} };
function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}
function failure(error: unknown): AttachmentActionState {
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
    message: "The attachment change could not be completed.",
    errors: {},
  };
}
async function contextOrError(): Promise<
  | {
      context: Awaited<ReturnType<typeof getSessionApiContext>>;
      error?: undefined;
    }
  | { context?: undefined; error: AttachmentActionState }
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
export async function createAttachmentAction(
  _previous: AttachmentActionState,
  formData: FormData,
): Promise<AttachmentActionState> {
  const title = value(formData, "title").trim();
  const attachableType = value(formData, "attachable_type");
  const attachableId = value(formData, "attachable_id");
  const notes = value(formData, "notes");
  const file = formData.get("file");
  if (!title)
    return { ok: false, message: "Enter an attachment title.", errors: {} };
  if (!/^[A-Za-z]+$/.test(attachableType) || !/^\d+$/.test(attachableId))
    return {
      ok: false,
      message: "Choose a supported entity and numeric ID.",
      errors: {},
    };
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, message: "Choose a non-empty file.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    const created = await context.client.request<{ data?: { id?: string } }>(
      "attachments.store",
      {
        body: {
          title,
          filename: file.name,
          attachable_type: attachableType,
          attachable_id: Number(attachableId),
          ...(notes ? { notes } : {}),
        },
      },
    );
    const newId = created.data?.data?.id;
    if (!newId)
      return {
        ok: false,
        message: "Firefly did not return the new attachment.",
        errors: {},
      };
    const upload = new FormData();
    upload.set("file", file);
    await context.client.request("attachments.upload", {
      pathParameters: { attachment: newId },
      body: upload,
      responseType: "json",
    });
    revalidatePath("/attachments");
    redirect(`/attachments/${newId}`);
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
export async function updateAttachmentAction(
  _previous: AttachmentActionState,
  formData: FormData,
): Promise<AttachmentActionState> {
  const id = value(formData, "attachment_id");
  const title = value(formData, "title").trim();
  const notes = value(formData, "notes");
  if (!/^\d+$/.test(id) || !title)
    return {
      ok: false,
      message: "Enter a valid attachment title.",
      errors: {},
    };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("attachments.update", {
      pathParameters: { attachment: id },
      body: { title, ...(notes ? { notes } : {}) },
    });
    revalidatePath(`/attachments/${id}`);
    revalidatePath("/attachments");
    return { ok: true, message: "Attachment metadata saved.", errors: {} };
  } catch (caught) {
    return failure(caught);
  }
}
export async function uploadAttachmentAction(
  _previous: AttachmentActionState,
  formData: FormData,
): Promise<AttachmentActionState> {
  const id = value(formData, "attachment_id");
  const file = formData.get("file");
  if (!/^\d+$/.test(id))
    return { ok: false, message: "Invalid attachment.", errors: {} };
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, message: "Choose a non-empty file.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    const upload = new FormData();
    upload.set("file", file);
    await context.client.request("attachments.upload", {
      pathParameters: { attachment: id },
      body: upload,
      responseType: "json",
    });
    revalidatePath(`/attachments/${id}`);
    return { ok: true, message: "File uploaded.", errors: {} };
  } catch (caught) {
    return failure(caught);
  }
}
export async function deleteAttachmentAction(
  _previous: AttachmentActionState,
  formData: FormData,
): Promise<AttachmentActionState> {
  const id = value(formData, "attachment_id");
  if (!/^\d+$/.test(id))
    return { ok: false, message: "Invalid attachment.", errors: {} };
  if (value(formData, "confirm_delete") !== "yes")
    return {
      ok: false,
      message: "Confirm the attachment deletion.",
      errors: {},
    };
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("attachments.delete", {
      pathParameters: { attachment: id },
    });
    revalidatePath("/attachments");
    redirect("/attachments");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
