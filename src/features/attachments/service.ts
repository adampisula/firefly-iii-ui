import type { createApiClient } from "../../lib/api/client.ts";

export type ApiClient = ReturnType<typeof createApiClient>;
export interface AttachmentRecord {
  id: string;
  attachableType: string;
  attachableId: string;
  title: string;
  filename: string;
  mime: string;
  size: number;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
export const ATTACHABLE_TYPES = [
  { value: "Bill", label: "Subscription / bill" },
  { value: "Budget", label: "Budget" },
  { value: "Category", label: "Category" },
  { value: "Tag", label: "Tag" },
  { value: "PiggyBank", label: "Piggy bank" },
  { value: "TransactionJournal", label: "Transaction journal" },
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function nullableText(value: unknown): string | null {
  const v = text(value);
  return v || null;
}
function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function mapAttachments(payload: unknown): AttachmentRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const attributes = asRecord(resource.attributes);
    const id = text(resource.id);
    const title = text(attributes.title);
    if (!id || !title) return [];
    return [
      {
        id,
        attachableType: text(attributes.attachable_type),
        attachableId: text(attributes.attachable_id),
        title,
        filename: text(attributes.filename),
        mime: text(attributes.mime),
        size: num(attributes.size),
        notes: nullableText(attributes.notes),
        createdAt: nullableText(attributes.created_at),
        updatedAt: nullableText(attributes.updated_at),
      },
    ];
  });
}
export function mapAttachment(payload: unknown): AttachmentRecord | null {
  return mapAttachments({ data: [asRecord(payload).data] })[0] ?? null;
}
export async function listAttachments(
  client: ApiClient,
): Promise<AttachmentRecord[]> {
  const r = await client.request("attachments.index", {
    query: { limit: 100 },
  });
  return mapAttachments(r.data);
}
export async function getAttachment(
  client: ApiClient,
  id: string,
): Promise<AttachmentRecord | null> {
  const r = await client.request("attachments.show", {
    pathParameters: { attachment: id },
  });
  return mapAttachment(r.data);
}
