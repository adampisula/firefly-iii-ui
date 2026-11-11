import type { createApiClient } from "../../lib/api/client.ts";

export type ApiClient = ReturnType<typeof createApiClient>;

export interface TransactionJournalView {
  journalId: string;
  type: string;
  date: string;
  order: number;
  description: string;
  amount: string;
  currencyCode: string;
  currencySymbol: string;
  decimalPlaces: number;
  foreignAmount: string | null;
  foreignCurrencyCode: string | null;
  foreignCurrencySymbol: string | null;
  foreignDecimalPlaces: number;
  sourceId: string;
  sourceName: string;
  sourceIban: string | null;
  sourceType: string;
  destinationId: string;
  destinationName: string;
  destinationIban: string | null;
  destinationType: string;
  budgetId: string | null;
  budgetName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  billId: string | null;
  billName: string | null;
  reconciled: boolean;
  notes: string | null;
  tags: readonly string[];
  internalReference: string | null;
  externalId: string | null;
  originalSource: string | null;
  recurrenceId: string | null;
  interestDate: string | null;
  bookDate: string | null;
  processDate: string | null;
  dueDate: string | null;
  paymentDate: string | null;
  invoiceDate: string | null;
  longitude: number | null;
  latitude: number | null;
  zoomLevel: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface TransactionGroupView {
  id: string;
  title: string;
  journals: readonly TransactionJournalView[];
}

export interface TransactionList {
  groups: readonly TransactionGroupView[];
  page: number;
  pageCount: number;
  total: number | null;
}

export interface AttachmentView {
  id: string;
  title: string;
  filename: string;
  mime: string;
  size: number;
  notes: string | null;
}

export interface PiggyEventView {
  id: string;
  piggyBankId: string | null;
  piggyBankName: string | null;
  amount: string;
  date: string | null;
  journalId: string | null;
}

export interface JournalLinkView {
  id: string;
  inwardId: string;
  outwardId: string;
  linkTypeId: string;
  notes: string | null;
}

export const TRANSACTION_TYPES = [
  { value: "default", label: "Withdrawals, deposits and transfers" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "deposit", label: "Deposits" },
  { value: "transfer", label: "Transfers" },
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
  const result = text(value);
  return result ? result : null;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function bool(value: unknown): boolean {
  return value === true;
}

export function mapJournal(value: unknown): TransactionJournalView | null {
  const record = asRecord(value);
  const journalId = text(record.transaction_journal_id);
  if (!journalId) return null;
  return {
    journalId,
    type: text(record.type),
    date: text(record.date),
    order: numberValue(record.order, 1),
    description: text(record.description),
    amount: text(record.amount),
    currencyCode: text(record.currency_code),
    currencySymbol: text(record.currency_symbol),
    decimalPlaces: numberValue(record.currency_decimal_places, 2),
    foreignAmount: nullableText(record.foreign_amount),
    foreignCurrencyCode: nullableText(record.foreign_currency_code),
    foreignCurrencySymbol: nullableText(record.foreign_currency_symbol),
    foreignDecimalPlaces: numberValue(
      record.foreign_currency_decimal_places,
      2,
    ),
    sourceId: text(record.source_id),
    sourceName: text(record.source_name),
    sourceIban: nullableText(record.source_iban),
    sourceType: text(record.source_type),
    destinationId: text(record.destination_id),
    destinationName: text(record.destination_name),
    destinationIban: nullableText(record.destination_iban),
    destinationType: text(record.destination_type),
    budgetId: nullableText(record.budget_id),
    budgetName: nullableText(record.budget_name),
    categoryId: nullableText(record.category_id),
    categoryName: nullableText(record.category_name),
    billId: nullableText(record.bill_id),
    billName: nullableText(record.bill_name),
    reconciled: bool(record.reconciled),
    notes: nullableText(record.notes),
    tags: Array.isArray(record.tags)
      ? record.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    internalReference: nullableText(record.internal_reference),
    externalId: nullableText(record.external_id),
    originalSource: nullableText(record.original_source),
    recurrenceId: nullableText(record.recurrence_id),
    interestDate: nullableText(record.interest_date),
    bookDate: nullableText(record.book_date),
    processDate: nullableText(record.process_date),
    dueDate: nullableText(record.due_date),
    paymentDate: nullableText(record.payment_date),
    invoiceDate: nullableText(record.invoice_date),
    longitude: nullableNumber(record.longitude),
    latitude: nullableNumber(record.latitude),
    zoomLevel: nullableNumber(record.zoom_level),
    createdAt: nullableText(record.created_at),
    updatedAt: nullableText(record.updated_at),
  };
}

export function mapGroup(value: unknown): TransactionGroupView | null {
  const resource = asRecord(value);
  const id = text(resource.id);
  const attributes = asRecord(resource.attributes);
  if (!id) return null;
  const journals = Array.isArray(attributes.transactions)
    ? attributes.transactions
        .map(mapJournal)
        .filter(
          (journal): journal is TransactionJournalView => journal !== null,
        )
    : [];
  return {
    id,
    title:
      text(attributes.group_title) || journals[0]?.description || `Group ${id}`,
    journals,
  };
}

export function mapTransactionList(payload: unknown): TransactionList {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  const groups = data
    .map(mapGroup)
    .filter((group): group is TransactionGroupView => group !== null);
  const pagination = asRecord(asRecord(root.meta).pagination);
  return {
    groups,
    page: numberValue(pagination.current_page, 1),
    pageCount: Math.max(1, numberValue(pagination.total_pages, 1)),
    total:
      typeof pagination.total === "number" && Number.isFinite(pagination.total)
        ? pagination.total
        : null,
  };
}

export function mapSingleGroup(payload: unknown): TransactionGroupView | null {
  return mapGroup(asRecord(payload).data);
}

export function mapAttachments(payload: unknown): AttachmentView[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const id = text(resource.id);
    const attributes = asRecord(resource.attributes);
    const title = text(attributes.title);
    if (!id || !title) return [];
    return [
      {
        id,
        title,
        filename: text(attributes.filename),
        mime: text(attributes.mime),
        size: numberValue(attributes.size),
        notes: nullableText(attributes.notes),
      },
    ];
  });
}

export function mapPiggyEvents(payload: unknown): PiggyEventView[] {
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
        piggyBankId: nullableText(attributes.piggy_bank_id),
        piggyBankName:
          nullableText(attributes.name) ??
          nullableText(attributes.piggy_bank_name),
        amount: text(attributes.amount),
        date: nullableText(attributes.date),
        journalId: nullableText(attributes.transaction_journal_id),
      },
    ];
  });
}

export function mapJournalLinks(payload: unknown): JournalLinkView[] {
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

export async function listTransactions(
  client: ApiClient,
  options: {
    type?: string;
    start?: string;
    end?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<TransactionList> {
  const response = await client.request("transactions.index", {
    query: {
      limit: options.limit ?? 25,
      page: options.page ?? 1,
      type: options.type ?? "default",
      ...(options.start ? { start: options.start } : {}),
      ...(options.end ? { end: options.end } : {}),
    },
  });
  return mapTransactionList(response.data);
}

export async function getTransactionGroup(
  client: ApiClient,
  id: string,
): Promise<TransactionGroupView | null> {
  const response = await client.request("transactions.show", {
    pathParameters: { transactionGroup: id },
  });
  return mapSingleGroup(response.data);
}

export async function getTransactionJournalGroup(
  client: ApiClient,
  journalId: string,
): Promise<TransactionGroupView | null> {
  const response = await client.request("transaction-journals.show", {
    pathParameters: { transactionJournal: journalId },
  });
  return mapSingleGroup(response.data);
}

export async function getTransactionAttachments(
  client: ApiClient,
  groupId: string,
): Promise<AttachmentView[]> {
  const response = await client.request("transactions.attachments", {
    pathParameters: { transactionGroup: groupId },
  });
  return mapAttachments(response.data);
}

export async function getTransactionPiggyEvents(
  client: ApiClient,
  groupId: string,
): Promise<PiggyEventView[]> {
  const response = await client.request("transactions.piggy-bank-events", {
    pathParameters: { transactionGroup: groupId },
  });
  return mapPiggyEvents(response.data);
}

export async function getJournalLinks(
  client: ApiClient,
  journalId: string,
): Promise<JournalLinkView[]> {
  const response = await client.request("transaction-journals.links", {
    pathParameters: { transactionJournal: journalId },
  });
  return mapJournalLinks(response.data);
}

export function transactionTypeLabel(type: string): string {
  return TRANSACTION_TYPES.find((item) => item.value === type)?.label ?? type;
}

export interface OptionItem {
  id: string;
  name: string;
}

export interface EditorOptions {
  accounts: readonly (OptionItem & { type: string; currencyCode: string })[];
  currencies: readonly { code: string; name: string }[];
  categories: readonly OptionItem[];
  budgets: readonly OptionItem[];
  bills: readonly OptionItem[];
  tags: readonly OptionItem[];
}

function mapOptionList(payload: unknown): OptionItem[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const id = text(resource.id);
    const attributes = asRecord(resource.attributes);
    const name = text(attributes.name) || text(attributes.title);
    return id && name ? [{ id, name }] : [];
  });
}

export function mapEditorAccounts(payload: unknown): (OptionItem & {
  type: string;
  currencyCode: string;
})[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const id = text(resource.id);
    const attributes = asRecord(resource.attributes);
    const name = text(attributes.name);
    const type = text(attributes.type);
    return id && name && type
      ? [{ id, name, type, currencyCode: text(attributes.currency_code) }]
      : [];
  });
}

export function mapCurrencyOptions(
  payload: unknown,
): { code: string; name: string }[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const resource = asRecord(value);
    const attributes = asRecord(resource.attributes);
    const code = text(attributes.code);
    const name = text(attributes.name);
    return code && name ? [{ code, name }] : [];
  });
}

export async function loadEditorOptions(
  client: ApiClient,
): Promise<EditorOptions> {
  const [accounts, currencies, categories, budgets, bills, tags] =
    await Promise.all([
      client.request("accounts.index", { query: { limit: 100 } }),
      client.request("currencies.index", { query: { limit: 100 } }),
      client.request("categories.index", { query: { limit: 100 } }),
      client.request("budgets.index", { query: { limit: 100 } }),
      client.request("bills.index", { query: { limit: 100 } }),
      client.request("tags.index", { query: { limit: 100 } }),
    ]);
  return {
    accounts: mapEditorAccounts(accounts.data).sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
    currencies: mapCurrencyOptions(currencies.data).sort((left, right) =>
      left.code.localeCompare(right.code),
    ),
    categories: mapOptionList(categories.data),
    budgets: mapOptionList(budgets.data),
    bills: mapOptionList(bills.data),
    tags: mapOptionList(tags.data),
  };
}

export interface TransactionDraftJournal {
  journalId?: string;
  type: string;
  date: string;
  amount: string;
  description: string;
  sourceId: string;
  destinationId: string;
  currencyCode: string;
  foreignAmount: string;
  foreignCurrencyCode: string;
  categoryId: string;
  budgetId: string;
  billId: string;
  tags: string;
  notes: string;
  internalReference: string;
  externalUrl: string;
  reconciled: boolean;
}

export interface TransactionDraft {
  groupTitle: string;
  applyRules: boolean;
  fireWebhooks: boolean;
  errorIfDuplicate: boolean;
  journals: readonly TransactionDraftJournal[];
}

export function validateTransactionDraft(draft: TransactionDraft): {
  ok: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  if (draft.journals.length === 0) errors.journals = "Add at least one split.";
  if (draft.journals.length > 100) errors.journals = "Use at most 100 splits.";
  draft.journals.forEach((journal, index) => {
    const prefix = `transactions.${index}`;
    if (!["withdrawal", "deposit", "transfer"].includes(journal.type)) {
      errors[`${prefix}.type`] = "Choose a supported transaction type.";
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(journal.date)) {
      errors[`${prefix}.date`] = "Enter a valid date.";
    }
    if (!journal.description.trim()) {
      errors[`${prefix}.description`] = "Enter a description.";
    }
    if (
      !/^\d+(?:\.\d+)?$/.test(journal.amount) ||
      Number(journal.amount) <= 0
    ) {
      errors[`${prefix}.amount`] = "Enter a positive decimal amount.";
    }
    if (!journal.sourceId)
      errors[`${prefix}.source_id`] = "Choose a source account.";
    if (!journal.destinationId)
      errors[`${prefix}.destination_id`] = "Choose a destination account.";
    if (
      journal.type === "transfer" &&
      journal.sourceId &&
      journal.sourceId === journal.destinationId
    ) {
      errors[`${prefix}.destination_id`] =
        "A transfer requires two different accounts.";
    }
    if (!journal.currencyCode)
      errors[`${prefix}.currency_code`] = "Choose a currency.";
    if (
      (journal.foreignAmount === "") !==
      (journal.foreignCurrencyCode === "")
    ) {
      errors[`${prefix}.foreign_amount`] =
        "Foreign amount and foreign currency must be provided together.";
    }
    if (
      journal.foreignAmount &&
      (!/^\d+(?:\.\d+)?$/.test(journal.foreignAmount) ||
        Number(journal.foreignAmount) <= 0)
    ) {
      errors[`${prefix}.foreign_amount`] = "Enter a positive foreign amount.";
    }
  });
  return { ok: Object.keys(errors).length === 0, errors };
}

export function transactionPayload(
  draft: TransactionDraft,
): Record<string, unknown> {
  return {
    group_title:
      draft.groupTitle.trim() || draft.journals[0]?.description.trim(),
    apply_rules: draft.applyRules,
    fire_webhooks: draft.fireWebhooks,
    error_if_duplicate_hash: draft.errorIfDuplicate,
    transactions: draft.journals.map((journal) => ({
      ...(journal.journalId
        ? { transaction_journal_id: journal.journalId }
        : {}),
      type: journal.type,
      date: journal.date,
      amount: journal.amount,
      description: journal.description.trim(),
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
      ...(journal.tags.trim()
        ? {
            tags: journal.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          }
        : {}),
      ...(journal.notes ? { notes: journal.notes } : {}),
      ...(journal.internalReference
        ? { internal_reference: journal.internalReference }
        : {}),
      ...(journal.externalUrl ? { external_url: journal.externalUrl } : {}),
    })),
  };
}
