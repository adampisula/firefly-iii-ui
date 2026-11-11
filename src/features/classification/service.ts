import type { createApiClient } from "../../lib/api/client.ts";
import {
  mapTransactionList,
  type TransactionList,
} from "../transactions/service.ts";

export type ApiClient = ReturnType<typeof createApiClient>;
export interface CategoryRecord {
  id: string;
  name: string;
  notes: string | null;
}
export interface TagRecord {
  id: string;
  tag: string;
  description: string | null;
  date: string | null;
}
export interface ObjectGroupRecord {
  id: string;
  title: string;
  order: number;
}

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

export function mapCategories(payload: unknown): CategoryRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const attributes = asRecord(resource.attributes);
    const id = text(resource.id);
    const name = text(attributes.name);
    return id && name
      ? [{ id, name, notes: nullableText(attributes.notes) }]
      : [];
  });
}
export function mapCategory(payload: unknown): CategoryRecord | null {
  return mapCategories({ data: [asRecord(payload).data] })[0] ?? null;
}
export function mapTags(payload: unknown): TagRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const attributes = asRecord(resource.attributes);
    const id = text(resource.id);
    const tag = text(attributes.tag);
    return id && tag
      ? [
          {
            id,
            tag,
            description: nullableText(attributes.description),
            date: nullableText(attributes.date),
          },
        ]
      : [];
  });
}
export function mapTag(payload: unknown): TagRecord | null {
  return mapTags({ data: [asRecord(payload).data] })[0] ?? null;
}
export function mapObjectGroups(payload: unknown): ObjectGroupRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const attributes = asRecord(resource.attributes);
    const id = text(resource.id);
    const title = text(attributes.title);
    return id && title ? [{ id, title, order: num(attributes.order) }] : [];
  });
}
export function mapObjectGroup(payload: unknown): ObjectGroupRecord | null {
  return mapObjectGroups({ data: [asRecord(payload).data] })[0] ?? null;
}

export async function listCategories(
  client: ApiClient,
): Promise<CategoryRecord[]> {
  const r = await client.request("categories.index", { query: { limit: 100 } });
  return mapCategories(r.data);
}
export async function getCategory(
  client: ApiClient,
  id: string,
): Promise<CategoryRecord | null> {
  const r = await client.request("categories.show", {
    pathParameters: { category: id },
  });
  return mapCategory(r.data);
}
export async function categoryTransactions(
  client: ApiClient,
  id: string,
): Promise<TransactionList> {
  const r = await client.request("categories.transactions", {
    pathParameters: { category: id },
    query: { limit: 25 },
  });
  return mapTransactionList(r.data);
}
export async function listTags(client: ApiClient): Promise<TagRecord[]> {
  const r = await client.request("tags.index", { query: { limit: 100 } });
  return mapTags(r.data);
}
export async function getTag(
  client: ApiClient,
  tag: string,
): Promise<TagRecord | null> {
  const r = await client.request("tags.show", {
    pathParameters: { tagOrId: tag },
  });
  return mapTag(r.data);
}
export async function tagTransactions(
  client: ApiClient,
  tag: string,
): Promise<TransactionList> {
  const r = await client.request("tags.transactions", {
    pathParameters: { tagOrId: tag },
    query: { limit: 25 },
  });
  return mapTransactionList(r.data);
}
export async function listObjectGroups(
  client: ApiClient,
): Promise<ObjectGroupRecord[]> {
  const r = await client.request("object-groups.index", {
    query: { limit: 100 },
  });
  return mapObjectGroups(r.data);
}
export async function getObjectGroup(
  client: ApiClient,
  id: string,
): Promise<ObjectGroupRecord | null> {
  const r = await client.request("object-groups.show", {
    pathParameters: { objectGroup: id },
  });
  return mapObjectGroup(r.data);
}
export async function objectGroupPiggyBanks(
  client: ApiClient,
  id: string,
): Promise<{ id: string; name: string }[]> {
  const r = await client.request("object-groups.piggy-banks", {
    pathParameters: { objectGroup: id },
    query: { limit: 100 },
  });
  return mapCategories(r.data).map((item) => ({
    id: item.id,
    name: item.name,
  }));
}
export async function objectGroupBills(
  client: ApiClient,
  id: string,
): Promise<{ id: string; name: string }[]> {
  const r = await client.request("object-groups.bills", {
    pathParameters: { objectGroup: id },
    query: { limit: 100 },
  });
  return mapCategories(r.data).map((item) => ({
    id: item.id,
    name: item.name,
  }));
}
