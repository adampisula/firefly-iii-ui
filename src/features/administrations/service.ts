import type { createApiClient } from "../../lib/api/client.ts";
export type ApiClient = ReturnType<typeof createApiClient>;
export interface GroupMember {
  id: string;
  email: string;
  role: string;
}
export interface AdministrationRecord {
  id: string;
  title: string;
  primaryCurrencyCode: string;
  canSeeMembers: boolean;
  members: GroupMember[];
}
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
export function mapAdministrations(payload: unknown): AdministrationRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const r = asRecord(value);
    const a = asRecord(r.attributes);
    const id = text(r.id);
    const title = text(a.title);
    if (!id || !title) return [];
    const members = Array.isArray(a.members) ? a.members : [];
    return [
      {
        id,
        title,
        primaryCurrencyCode: text(a.primary_currency_code),
        canSeeMembers: a.can_see_members === true,
        members: members.flatMap((member) => {
          const m = asRecord(member);
          const email = text(m.email);
          return email ? [{ id: text(m.id), email, role: text(m.role) }] : [];
        }),
      },
    ];
  });
}
export async function listAdministrations(
  client: ApiClient,
): Promise<AdministrationRecord[]> {
  const r = await client.request("user-groups.index", {
    query: { limit: 100 },
  });
  return mapAdministrations(r.data);
}
export async function getAdministration(
  client: ApiClient,
  id: string,
): Promise<AdministrationRecord | null> {
  const r = await client.request("user-groups.show", {
    pathParameters: { userGroup: id },
  });
  return mapAdministrations({ data: [asRecord(r.data).data] })[0] ?? null;
}
