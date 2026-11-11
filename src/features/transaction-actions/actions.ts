"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
import { getTransactionGroup } from "@/features/transactions/service";
import { buildCloneTransactions, buildConversion } from "./service";

export interface LinkActionState {
  ok: boolean;
  message: string;
  errors: Record<string, string>;
}

const INITIAL: LinkActionState = { ok: false, message: "", errors: {} };

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}

function failure(error: unknown): LinkActionState {
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
    message: "The change could not be completed.",
    errors: {},
  };
}

async function contextOrError(): Promise<
  | {
      context: Awaited<ReturnType<typeof getSessionApiContext>>;
      error?: undefined;
    }
  | { context?: undefined; error: LinkActionState }
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

export async function createLinkAction(
  _previous: LinkActionState,
  formData: FormData,
): Promise<LinkActionState> {
  const groupId = value(formData, "group_id");
  const currentJournal = value(formData, "current_journal");
  const otherJournal = value(formData, "other_journal");
  const linkTypeId = value(formData, "link_type_id");
  const direction = value(formData, "direction");
  const notes = value(formData, "notes");
  if (!/^\d+$/.test(groupId) || !/^\d+$/.test(currentJournal)) {
    return { ok: false, message: "Invalid journal identity.", errors: {} };
  }
  if (!/^\d+$/.test(otherJournal) || otherJournal === currentJournal) {
    return {
      ok: false,
      message: "Enter a different existing journal ID.",
      errors: { other_journal: "Enter a different journal ID." },
    };
  }
  if (!/^\d+$/.test(linkTypeId)) {
    return { ok: false, message: "Choose a link type.", errors: {} };
  }
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("transaction-links.store", {
      body: {
        link_type_id: linkTypeId,
        inward_id: direction === "inward" ? currentJournal : otherJournal,
        outward_id: direction === "inward" ? otherJournal : currentJournal,
        ...(notes ? { notes } : {}),
      },
    });
    revalidatePath(`/transactions/${groupId}`);
    return { ok: true, message: "Link created.", errors: {} };
  } catch (caught) {
    return failure(caught);
  }
}

export async function deleteLinkAction(
  _previous: LinkActionState,
  formData: FormData,
): Promise<LinkActionState> {
  const linkId = value(formData, "link_id");
  const groupId = value(formData, "group_id");
  if (!/^\d+$/.test(linkId) || !/^\d+$/.test(groupId)) {
    return { ok: false, message: "Invalid link identity.", errors: {} };
  }
  if (value(formData, "confirm_delete") !== "yes") {
    return { ok: false, message: "Confirm the unlink first.", errors: {} };
  }
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("transaction-links.delete", {
      pathParameters: { journalLink: linkId },
    });
    revalidatePath(`/transactions/${groupId}`);
    return { ok: true, message: "Link removed.", errors: {} };
  } catch (caught) {
    return failure(caught);
  }
}

export async function saveLinkTypeAction(
  _previous: LinkActionState,
  formData: FormData,
): Promise<LinkActionState> {
  const id = value(formData, "link_type_id");
  const name = value(formData, "name").trim();
  const inward = value(formData, "inward").trim();
  const outward = value(formData, "outward").trim();
  if (!name || !inward || !outward) {
    return {
      ok: false,
      message: "Name, inward and outward descriptions are required.",
      errors: {},
    };
  }
  if (inward === outward) {
    return {
      ok: false,
      message: "Inward and outward descriptions must differ.",
      errors: { inward: "Must differ from outward." },
    };
  }
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    if (id) {
      await context.client.request("link-types.update", {
        pathParameters: { linkType: id },
        body: { name, inward, outward },
      });
    } else {
      await context.client.request("link-types.store", {
        body: { name, inward, outward },
      });
    }
    revalidatePath("/link-types");
    return { ok: true, message: "Link type saved.", errors: {} };
  } catch (caught) {
    return failure(caught);
  }
}

export async function deleteLinkTypeAction(
  _previous: LinkActionState,
  formData: FormData,
): Promise<LinkActionState> {
  const id = value(formData, "link_type_id");
  if (!/^\d+$/.test(id)) {
    return { ok: false, message: "Invalid link type.", errors: {} };
  }
  if (value(formData, "confirm_delete") !== "yes") {
    return {
      ok: false,
      message: "Confirm the link-type deletion.",
      errors: {},
    };
  }
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    await context.client.request("link-types.delete", {
      pathParameters: { linkType: id },
    });
    revalidatePath("/link-types");
    return { ok: true, message: "Link type deleted.", errors: {} };
  } catch (caught) {
    return failure(caught);
  }
}

export async function cloneTransactionAction(
  _previous: LinkActionState,
  formData: FormData,
): Promise<LinkActionState> {
  const groupId = value(formData, "group_id");
  const edit = value(formData, "mode") === "edit";
  if (!/^\d+$/.test(groupId)) {
    return { ok: false, message: "Invalid transaction group.", errors: {} };
  }
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    const group = await getTransactionGroup(context.client, groupId);
    if (!group) {
      return {
        ok: false,
        message: "The source transaction no longer exists.",
        errors: {},
      };
    }
    const response = await context.client.request<{ data?: { id?: string } }>(
      "transactions.store",
      {
        body: {
          group_title: `${group.title} (copy)`,
          apply_rules: false,
          fire_webhooks: false,
          error_if_duplicate_hash: false,
          transactions: buildCloneTransactions(group),
        },
      },
    );
    const newId = response.data?.data?.id;
    revalidatePath("/transactions");
    if (!newId)
      return {
        ok: false,
        message: "Clone did not return a new group.",
        errors: {},
      };
    redirect(edit ? `/transactions/${newId}/edit` : `/transactions/${newId}`);
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}

export async function convertTransactionAction(
  _previous: LinkActionState,
  formData: FormData,
): Promise<LinkActionState> {
  const groupId = value(formData, "group_id");
  const targetType = value(formData, "target_type");
  if (!/^\d+$/.test(groupId)) {
    return { ok: false, message: "Invalid transaction group.", errors: {} };
  }
  if (!["withdrawal", "deposit", "transfer"].includes(targetType)) {
    return { ok: false, message: "Choose a valid target type.", errors: {} };
  }
  const { context, error } = await contextOrError();
  if (!context) return error ?? INITIAL;
  try {
    const group = await getTransactionGroup(context.client, groupId);
    if (!group) {
      return {
        ok: false,
        message: "The transaction no longer exists.",
        errors: {},
      };
    }
    const conversion = buildConversion(group, targetType);
    if (!conversion.ok) {
      return { ok: false, message: conversion.message, errors: {} };
    }
    await context.client.request("transactions.update", {
      pathParameters: { transactionGroup: groupId },
      body: {
        group_title: group.title,
        apply_rules: false,
        fire_webhooks: false,
        transactions: conversion.transactions,
      },
    });
    revalidatePath(`/transactions/${groupId}`);
    return { ok: true, message: "Transaction type converted.", errors: {} };
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
