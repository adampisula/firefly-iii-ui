import type { createApiClient } from "../../lib/api/client.ts";

export type ApiClient = ReturnType<typeof createApiClient>;
export interface RuleGroupRecord {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  order: number;
}
export interface RuleTriggerRecord {
  id?: string;
  type: string;
  value: string;
  active: boolean;
  stopProcessing: boolean;
}
export interface RuleActionRecord {
  id?: string;
  type: string;
  value: string;
  active: boolean;
  stopProcessing: boolean;
}
export interface RuleRecord {
  id: string;
  title: string;
  description: string | null;
  ruleGroupId: string;
  ruleGroupTitle: string;
  trigger: string;
  strict: boolean;
  stopProcessing: boolean;
  active: boolean;
  triggers: RuleTriggerRecord[];
  actions: RuleActionRecord[];
}

export const RULE_MOMENTS = [
  { value: "store-journal", label: "When a transaction is stored" },
  { value: "update-journal", label: "When a transaction is updated" },
  { value: "manual-activation", label: "Manual activation only" },
] as const;
export const TRIGGER_TYPES = [
  "description_is",
  "description_contains",
  "description_starts",
  "description_ends",
  "description_regex",
  "amount_more",
  "amount_less",
  "amount_exactly",
  "amount_between",
  "date_after",
  "date_before",
  "date_is",
  "category_is",
  "budget_is",
  "tag_is",
  "account_is",
  "source_account_is",
  "destination_account_is",
  "bill_is",
  "transaction_type",
  "reconciled",
  "notes_contains",
  "notes_is",
  "currency_is",
  "foreign_currency_is",
  "has_attachments",
  "has_any_category",
  "has_no_category",
  "has_any_budget",
  "has_no_budget",
  "has_any_tag",
  "has_no_tag",
  "has_any_bill",
  "has_no_bill",
] as const;
export const ACTION_TYPES = [
  "set_category",
  "clear_category",
  "set_budget",
  "clear_budget",
  "add_tag",
  "remove_tag",
  "remove_all_tags",
  "set_description",
  "set_source_account",
  "set_destination_account",
  "set_notes",
  "clear_notes",
  "link_to_bill",
  "convert_withdrawal",
  "convert_deposit",
  "convert_transfer",
  "switch_accounts",
  "update_piggy",
  "delete_transaction",
  "set_source_to_cash",
  "set_destination_to_cash",
  "set_amount",
] as const;
const VALUELESS_ACTIONS = new Set([
  "clear_category",
  "clear_budget",
  "remove_all_tags",
  "clear_notes",
  "switch_accounts",
  "delete_transaction",
  "convert_withdrawal",
  "convert_deposit",
  "convert_transfer",
  "set_source_to_cash",
  "set_destination_to_cash",
]);

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
function bool(value: unknown, fallback = true): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function mapRuleGroups(payload: unknown): RuleGroupRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const r = asRecord(value);
    const a = asRecord(r.attributes);
    const id = text(r.id);
    const title = text(a.title);
    return id && title
      ? [
          {
            id,
            title,
            description: nullableText(a.description),
            active: bool(a.active),
            order: num(a.order),
          },
        ]
      : [];
  });
}
export function mapRuleGroup(payload: unknown): RuleGroupRecord | null {
  return mapRuleGroups({ data: [asRecord(payload).data] })[0] ?? null;
}
function mapRows(values: unknown): RuleTriggerRecord[] | RuleActionRecord[] {
  const data = Array.isArray(values) ? values : [];
  return data.flatMap((value) => {
    const r = asRecord(value);
    const type = text(r.type);
    if (!type) return [];
    return [
      {
        id: nullableText(r.id) ?? undefined,
        type,
        value: text(r.value),
        active: bool(r.active),
        stopProcessing: bool(r.stop_processing, false),
      },
    ];
  });
}
export function mapRules(payload: unknown): RuleRecord[] {
  const root = asRecord(payload);
  const data = Array.isArray(root.data) ? root.data : [];
  return data.flatMap((value) => {
    const r = asRecord(value);
    const a = asRecord(r.attributes);
    const id = text(r.id);
    const title = text(a.title);
    if (!id || !title) return [];
    return [
      {
        id,
        title,
        description: nullableText(a.description),
        ruleGroupId: text(a.rule_group_id),
        ruleGroupTitle: text(a.rule_group_title),
        trigger: text(a.trigger),
        strict: a.strict === true,
        stopProcessing: a.stop_processing === true,
        active: bool(a.active),
        triggers: mapRows(a.triggers) as RuleTriggerRecord[],
        actions: mapRows(a.actions) as RuleActionRecord[],
      },
    ];
  });
}
export function mapRule(payload: unknown): RuleRecord | null {
  return mapRules({ data: [asRecord(payload).data] })[0] ?? null;
}

export interface RuleDraft {
  title: string;
  description: string;
  ruleGroupId: string;
  trigger: string;
  strict: boolean;
  stopProcessing: boolean;
  active: boolean;
  triggers: RuleTriggerRecord[];
  actions: RuleActionRecord[];
}
export function validateRuleDraft(draft: RuleDraft): {
  ok: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  if (!draft.title.trim()) errors.title = "Enter a rule title.";
  if (!/^\d+$/.test(draft.ruleGroupId))
    errors.ruleGroupId = "Choose a rule group.";
  if (!RULE_MOMENTS.some((moment) => moment.value === draft.trigger))
    errors.trigger = "Choose a trigger moment.";
  if (draft.triggers.length === 0)
    errors.triggers = "Add at least one trigger.";
  if (draft.actions.length === 0) errors.actions = "Add at least one action.";
  draft.triggers.forEach((row, index) => {
    if (!(TRIGGER_TYPES as readonly string[]).includes(row.type))
      errors[`triggers.${index}.type`] = "Unsupported trigger.";
    if (!row.value.trim())
      errors[`triggers.${index}.value`] = "Trigger value is required.";
  });
  draft.actions.forEach((row, index) => {
    if (!(ACTION_TYPES as readonly string[]).includes(row.type))
      errors[`actions.${index}.type`] = "Unsupported action.";
    if (!VALUELESS_ACTIONS.has(row.type) && !row.value.trim())
      errors[`actions.${index}.value`] = "Action value is required.";
  });
  return { ok: Object.keys(errors).length === 0, errors };
}
export function rulePayload(draft: RuleDraft): Record<string, unknown> {
  return {
    title: draft.title.trim(),
    ...(draft.description ? { description: draft.description } : {}),
    rule_group_id: Number(draft.ruleGroupId),
    trigger: draft.trigger,
    strict: draft.strict,
    stop_processing: draft.stopProcessing,
    active: draft.active,
    triggers: draft.triggers.map((row) => ({
      type: row.type,
      value: row.value,
      active: row.active,
      stop_processing: row.stopProcessing,
    })),
    actions: draft.actions.map((row) => ({
      type: row.type,
      value: VALUELESS_ACTIONS.has(row.type) ? "" : row.value,
      active: row.active,
      stop_processing: row.stopProcessing,
    })),
  };
}
export function ruleGroupPayload(
  title: string,
  description: string,
  active: boolean,
  order: string,
): Record<string, unknown> {
  return {
    title: title.trim(),
    ...(description ? { description } : {}),
    active,
    ...(order ? { order: Number(order) } : {}),
  };
}

export async function listRuleGroups(
  client: ApiClient,
): Promise<RuleGroupRecord[]> {
  const r = await client.request("rule-groups.index", {
    query: { limit: 100 },
  });
  return mapRuleGroups(r.data);
}
export async function getRuleGroup(
  client: ApiClient,
  id: string,
): Promise<RuleGroupRecord | null> {
  const r = await client.request("rule-groups.show", {
    pathParameters: { ruleGroup: id },
  });
  return mapRuleGroup(r.data);
}
export async function listRules(client: ApiClient): Promise<RuleRecord[]> {
  const r = await client.request("rules.index", { query: { limit: 100 } });
  return mapRules(r.data);
}
export async function getRule(
  client: ApiClient,
  id: string,
): Promise<RuleRecord | null> {
  const r = await client.request("rules.show", {
    pathParameters: { rule: id },
  });
  return mapRule(r.data);
}
export async function groupRules(
  client: ApiClient,
  id: string,
): Promise<RuleRecord[]> {
  const r = await client.request("rule-groups.rules", {
    pathParameters: { ruleGroup: id },
    query: { limit: 100 },
  });
  return mapRules(r.data);
}
