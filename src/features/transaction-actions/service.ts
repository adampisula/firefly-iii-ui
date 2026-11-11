import type { ApiClient as TransactionApiClient } from "../transactions/service.ts";
import {
  mapTransactionList,
  type TransactionList,
} from "../transactions/service.ts";

export interface LinkType {
  id: string;
  name: string;
  inward: string;
  outward: string;
}

export interface TransactionLink {
  id: string;
  inwardId: string;
  outwardId: string;
  linkTypeId: string;
  notes: string | null;
}

export interface LinkTypeTransactions {
  linkType: LinkType;
  transactions: TransactionList;
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
  const result = text(value);
  return result ? result : null;
}

export function mapLinkTypes(payload: unknown): LinkType[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const id = text(resource.id);
    const attributes = asRecord(resource.attributes);
    const name = text(attributes.name);
    if (!id || !name) return [];
    return [
      {
        id,
        name,
        inward: text(attributes.inward),
        outward: text(attributes.outward),
      },
    ];
  });
}

export function mapLinkType(payload: unknown): LinkType | null {
  return mapLinkTypes({ data: [asRecord(payload).data] })[0] ?? null;
}

export function mapTransactionLinks(payload: unknown): TransactionLink[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const id = text(resource.id);
    const attributes = asRecord(resource.attributes);
    if (!id) return [];
    return [
      {
        id,
        inwardId: text(attributes.inward_id),
        outwardId: text(attributes.outward_id),
        linkTypeId: text(attributes.link_type_id),
        notes: nullableText(attributes.notes),
      },
    ];
  });
}

export async function listLinkTypes(
  client: TransactionApiClient,
): Promise<LinkType[]> {
  const response = await client.request("link-types.index", {
    query: { limit: 100 },
  });
  return mapLinkTypes(response.data);
}

export async function listTransactionLinks(
  client: TransactionApiClient,
): Promise<TransactionLink[]> {
  const response = await client.request("transaction-links.index", {
    query: { limit: 100 },
  });
  return mapTransactionLinks(response.data);
}

export async function getLinkTypeTransactions(
  client: TransactionApiClient,
  id: string,
): Promise<LinkTypeTransactions | null> {
  const [linkTypeResponse, transactionsResponse] = await Promise.all([
    client.request("link-types.show", { pathParameters: { linkType: id } }),
    client.request("link-types.transactions", {
      pathParameters: { linkType: id },
      query: { limit: 25 },
    }),
  ]);
  const linkType = mapLinkType(linkTypeResponse.data);
  if (!linkType) return null;
  return {
    linkType,
    transactions: mapTransactionList(transactionsResponse.data),
  };
}

export function linksForJournal(
  links: readonly TransactionLink[],
  journalId: string,
): TransactionLink[] {
  return links.filter(
    (link) => link.inwardId === journalId || link.outwardId === journalId,
  );
}

import type { TransactionGroupView } from "../transactions/service.ts";

function journalPayload(journal: TransactionGroupView["journals"][number]) {
  return {
    type: journal.type,
    date: journal.date.slice(0, 10),
    amount: journal.amount,
    description: journal.description,
    source_id: journal.sourceId,
    destination_id: journal.destinationId,
    currency_code: journal.currencyCode,
    ...(journal.foreignAmount
      ? {
          foreign_amount: journal.foreignAmount,
          foreign_currency_code: journal.foreignCurrencyCode,
        }
      : {}),
    ...(journal.categoryId ? { category_id: journal.categoryId } : {}),
    ...(journal.budgetId ? { budget_id: journal.budgetId } : {}),
    ...(journal.billId ? { bill_id: journal.billId } : {}),
    ...(journal.tags.length > 0 ? { tags: [...journal.tags] } : {}),
    ...(journal.notes ? { notes: journal.notes } : {}),
    ...(journal.internalReference
      ? { internal_reference: journal.internalReference }
      : {}),
  };
}

export function buildCloneTransactions(
  group: TransactionGroupView,
): Record<string, unknown>[] {
  return group.journals.map((journal) => journalPayload(journal));
}

const ASSET_TYPES = new Set(["asset", "liability", "liabilities"]);

export function buildConversion(
  group: TransactionGroupView,
  targetType: string,
):
  | { ok: true; transactions: Record<string, unknown>[] }
  | { ok: false; message: string } {
  if (!["withdrawal", "deposit", "transfer"].includes(targetType)) {
    return { ok: false, message: "Choose a valid target type." };
  }
  if (group.journals.some((journal) => journal.reconciled)) {
    return {
      ok: false,
      message: "Reconciled transactions cannot be converted here.",
    };
  }
  const transactions: Record<string, unknown>[] = [];
  for (const journal of group.journals) {
    let sourceId = journal.sourceId;
    let destinationId = journal.destinationId;
    if (
      (journal.type === "withdrawal" && targetType === "deposit") ||
      (journal.type === "deposit" && targetType === "withdrawal")
    ) {
      sourceId = journal.destinationId;
      destinationId = journal.sourceId;
    } else if (targetType === "transfer") {
      if (
        !ASSET_TYPES.has(journal.sourceType) ||
        !ASSET_TYPES.has(journal.destinationType)
      ) {
        return {
          ok: false,
          message:
            "A transfer requires asset or liability accounts on both sides.",
        };
      }
    } else if (journal.type === "transfer") {
      return {
        ok: false,
        message:
          "A transfer cannot be converted without selecting a valid expense or revenue counterparty.",
      };
    }
    transactions.push({
      ...journalPayload(journal),
      transaction_journal_id: journal.journalId,
      type: targetType,
      source_id: sourceId,
      destination_id: destinationId,
    });
  }
  return { ok: true, transactions };
}
