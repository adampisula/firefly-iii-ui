import {
  API_OPERATIONS,
  resolveOperationPath,
  type ApiOperation,
} from "../api/operations.ts";
import type { createApiClient } from "../api/client.ts";
import { mapAccountList } from "../../features/accounts/service.ts";
import {
  mapChart,
  mapInsights,
  mapSummary,
  type InsightOperation,
} from "../../features/analysis/service.ts";
import { mapBudgetLimits, mapBudgets } from "../../features/budgets/service.ts";
import {
  mapCategories,
  mapTags,
} from "../../features/classification/service.ts";
import { mapBills } from "../../features/subscriptions/service.ts";
import { mapTransactionList } from "../../features/transactions/service.ts";
import {
  getPiggyBank,
  mapPiggyBanks,
  piggyPayload,
  validatePiggyDraft,
  type PiggyDraft,
} from "../../features/piggy-banks/service.ts";
import { adjustPiggyAmount } from "./piggy.ts";
import { ASSISTANT_LIMITS } from "./config.ts";
import type { AssistantSettings } from "./provider-config.ts";

export type ApiClient = ReturnType<typeof createApiClient>;

export interface AssistantToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  kind: "read" | "write";
}

export interface PreparedWrite {
  operation: ApiOperation;
  pathParameters?: Record<string, string>;
  query?: Record<string, string | string[]>;
  body?: unknown;
  summary: string;
}

export type PreparedTool =
  | { kind: "read"; data: unknown }
  | { kind: "write"; write: PreparedWrite };

export interface ToolContext {
  client: ApiClient;
  settings: AssistantSettings;
}

const dateSchema = {
  type: "string",
  description: "ISO date YYYY-MM-DD",
} as const;

function objectSchema(
  properties: Record<string, unknown>,
  required: string[] = [],
): Record<string, unknown> {
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

const BLOCKED_OPERATION_PREFIXES = [
  "data.",
  "configuration.",
  "users.",
  "user-groups.",
  "webhooks.",
] as const;

const RISKY_OPERATION_IDS = new Set<string>([
  "accounts.delete",
  "transactions.update",
  "transactions.delete",
  "currencies.update",
  "currencies.delete",
  "currencies.primary",
  "attachments.delete",
  "attachments.update",
  "rules.test",
  "recurrences.trigger",
  "rule-groups.update",
  "rule-groups.delete",
]);

const CURATED_WRITE_OPERATIONS = new Set<string>([
  "piggy-banks.store",
  "piggy-banks.update",
]);

export function isBlockedOperation(operation: string): boolean {
  return (
    BLOCKED_OPERATION_PREFIXES.some((prefix) => operation.startsWith(prefix)) ||
    operation.startsWith("attachments.upload") ||
    operation.startsWith("attachments.download")
  );
}

export function isRiskyOperation(operation: string): boolean {
  return RISKY_OPERATION_IDS.has(operation) || operation.endsWith(".delete");
}

function tool(
  name: string,
  description: string,
  parameters: Record<string, unknown>,
  kind: "read" | "write" = "read",
): AssistantToolDefinition {
  return { name, description, parameters, kind };
}

const READ_TOOLS: AssistantToolDefinition[] = [
  tool(
    "firefly_summary",
    "Read Firefly summary totals for a date range. Use this first for balances, spending, income and net worth. Amounts are decimal strings.",
    objectSchema({ start: dateSchema, end: dateSchema }, ["start", "end"]),
  ),
  tool(
    "firefly_list_accounts",
    "List Firefly accounts and their current balances. Use account IDs for follow-up tools.",
    objectSchema({
      limit: { type: "integer", minimum: 1, maximum: 100 },
      type: {
        type: "string",
        enum: ["asset", "expense", "revenue", "liability"],
      },
    }),
  ),
  tool(
    "firefly_list_transactions",
    "List transactions in a date range. Split groups remain grouped; do not invent a combined total.",
    objectSchema({
      start: dateSchema,
      end: dateSchema,
      limit: { type: "integer", minimum: 1, maximum: 50 },
      type: {
        type: "string",
        enum: ["all", "withdrawal", "deposit", "transfer", "opening_balance"],
      },
    }),
  ),
  tool(
    "firefly_search_transactions",
    "Search transactions using Firefly's query grammar.",
    objectSchema(
      {
        query: { type: "string", minLength: 1, maxLength: 500 },
        limit: { type: "integer", minimum: 1, maximum: 50 },
      },
      ["query"],
    ),
  ),
  tool(
    "firefly_list_budgets",
    "List budgets with spending for a date range.",
    objectSchema({
      start: dateSchema,
      end: dateSchema,
      limit: { type: "integer", minimum: 1, maximum: 100 },
    }),
  ),
  tool(
    "firefly_list_budget_limits",
    "List budget limits. Provide budgetId for one budget, or a date range for all limits.",
    objectSchema({
      budgetId: { type: "string" },
      start: dateSchema,
      end: dateSchema,
    }),
  ),
  tool(
    "firefly_list_bills",
    "List subscriptions and bills with expected payment dates.",
    objectSchema({ limit: { type: "integer", minimum: 1, maximum: 100 } }),
  ),
  tool(
    "firefly_list_piggy_banks",
    "List savings goals (piggy banks), their reserved amounts, target amounts and accounts.",
    objectSchema({ limit: { type: "integer", minimum: 1, maximum: 100 } }),
  ),
  tool(
    "firefly_piggy_events",
    "List the event history for one savings goal.",
    objectSchema(
      {
        piggyBankId: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 100 },
      },
      ["piggyBankId"],
    ),
  ),
  tool(
    "firefly_list_categories",
    "List categories.",
    objectSchema({ limit: { type: "integer", minimum: 1, maximum: 100 } }),
  ),
  tool(
    "firefly_list_tags",
    "List tags.",
    objectSchema({ limit: { type: "integer", minimum: 1, maximum: 100 } }),
  ),
  tool(
    "firefly_balance_chart",
    "Read the balance chart series for a date range.",
    objectSchema({ start: dateSchema, end: dateSchema }, ["start", "end"]),
  ),
  tool(
    "firefly_account_chart",
    "Read the account overview chart series for a date range.",
    objectSchema({ start: dateSchema, end: dateSchema }, ["start", "end"]),
  ),
  tool(
    "firefly_insight",
    "Read one supported Firefly insight aggregate.",
    objectSchema(
      {
        kind: {
          type: "string",
          enum: [
            "expense-total",
            "income-total",
            "transfer-total",
            "expense-category",
            "income-category",
          ],
        },
        start: dateSchema,
        end: dateSchema,
      },
      ["kind", "start", "end"],
    ),
  ),
  tool(
    "firefly_list_operations",
    "Discover Firefly API operations. Use this before calling an endpoint not covered by the curated tools. Returns operation IDs, methods, paths, path parameters and whether an operation is blocked or risky.",
    objectSchema({
      query: { type: "string", maxLength: 120 },
      method: {
        type: "string",
        enum: ["GET", "POST", "PUT", "DELETE"],
      },
      financialOnly: { type: "boolean" },
    }),
  ),
  tool(
    "firefly_read_operation",
    "Execute one read-only GET operation from the Firefly operation registry. Use firefly_list_operations to find the operation ID.",
    objectSchema(
      {
        operation: { type: "string" },
        pathParameters: { type: "object" },
        query: { type: "object" },
      },
      ["operation"],
    ),
  ),
];

const WRITE_TOOLS: AssistantToolDefinition[] = [
  tool(
    "firefly_create_piggy_bank",
    "Create a Firefly savings goal (piggy bank). This changes reserved money and requires explicit user approval.",
    objectSchema(
      {
        name: { type: "string", minLength: 1, maxLength: 255 },
        targetAmount: { type: "string" },
        currencyCode: { type: "string", minLength: 3, maxLength: 3 },
        accountId: { type: "string" },
        startDate: dateSchema,
        targetDate: dateSchema,
        initialAmount: { type: "string" },
        notes: { type: "string", maxLength: 65535 },
      },
      ["name", "targetAmount", "currencyCode", "accountId", "startDate"],
    ),
    "write",
  ),
  tool(
    "firefly_add_piggy_money",
    "Add reserved money to a savings goal. The tool preserves other account allocations and requires explicit user approval.",
    objectSchema(
      {
        piggyBankId: { type: "string" },
        accountId: { type: "string" },
        amount: { type: "string" },
      },
      ["piggyBankId", "amount"],
    ),
    "write",
  ),
  tool(
    "firefly_remove_piggy_money",
    "Remove reserved money from a savings goal. Rejects amounts above the current reserved amount and requires explicit user approval.",
    objectSchema(
      {
        piggyBankId: { type: "string" },
        accountId: { type: "string" },
        amount: { type: "string" },
      },
      ["piggyBankId", "amount"],
    ),
    "write",
  ),
  tool(
    "firefly_request_write",
    "Request one mutating Firefly operation. This never executes immediately: the user must approve the exact operation and payload. Use firefly_list_operations first.",
    objectSchema(
      {
        operation: { type: "string" },
        pathParameters: { type: "object" },
        query: { type: "object" },
        body: { type: "object" },
      },
      ["operation"],
    ),
    "write",
  ),
];

export function availableTools(
  settings: AssistantSettings,
): AssistantToolDefinition[] {
  return settings.writeToolsEnabled
    ? [...READ_TOOLS, ...WRITE_TOOLS]
    : READ_TOOLS;
}

export function openAiTools(
  settings: AssistantSettings,
): Record<string, unknown>[] {
  return availableTools(settings).map((definition) => ({
    type: "function",
    function: {
      name: definition.name,
      description: definition.description,
      parameters: definition.parameters,
    },
  }));
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringArg(
  args: Record<string, unknown>,
  key: string,
  required = false,
): string | undefined {
  const value = args[key];
  if (value === undefined || value === null) {
    if (required) throw new Error(`${key} is required.`);
    return undefined;
  }
  if (typeof value !== "string" || !value.trim())
    throw new Error(`${key} must be a non-empty string.`);
  return value.trim();
}

function numberArg(
  args: Record<string, unknown>,
  key: string,
  fallback: number,
  max: number,
): number {
  const value = args[key];
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(1, Math.round(value)));
}

function queryFor(
  values: Record<string, unknown>,
): Record<string, string | string[]> | undefined {
  const entries = Object.entries(values).filter(
    ([, value]) => value !== undefined,
  );
  if (entries.length === 0) return undefined;
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of entries) {
    if (!/^[a-zA-Z0-9_\-[\].:]+$/.test(key))
      throw new Error(`Invalid query key: ${key}`);
    if (Array.isArray(value)) {
      query[key] = value.map(String);
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      query[key] = String(value);
    } else {
      throw new Error(`Invalid query value for ${key}.`);
    }
  }
  return query;
}

function searchParamsFor(
  query?: Record<string, string | string[]>,
): URLSearchParams | undefined {
  if (!query) return undefined;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else {
      params.append(key, value);
    }
  }
  return params;
}

function pathParametersFor(
  operation: ApiOperation,
  value: unknown,
): Record<string, string> | undefined {
  const parameters = record(value);
  const definition = API_OPERATIONS[operation];
  const required = "pathParams" in definition ? definition.pathParams : [];
  if (Object.keys(parameters).length === 0) {
    if (required.length === 0) return undefined;
    throw new Error(`Path parameters are required: ${required.join(", ")}.`);
  }
  const normalized: Record<string, string> = {};
  for (const [key, raw] of Object.entries(parameters)) {
    if (typeof raw !== "string" && typeof raw !== "number")
      throw new Error(`Invalid path parameter ${key}.`);
    normalized[key] = String(raw);
  }
  resolveOperationPath(operation, normalized);
  return normalized;
}

function bodyFor(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("The write body must be a JSON object.");
  const serialized = JSON.stringify(value);
  if (serialized.length > ASSISTANT_LIMITS.maxBodyBytes)
    throw new Error("The write body is too large.");
  return value;
}

function operationMetadata(
  operation: string,
  definition: (typeof API_OPERATIONS)[ApiOperation],
) {
  return {
    operation,
    method: definition.method,
    path: definition.path,
    pathParameters: "pathParams" in definition ? definition.pathParams : [],
    body: "body" in definition ? definition.body : null,
    financial: definition.financial,
    blocked: isBlockedOperation(operation),
    risky: isRiskyOperation(operation),
  };
}

export function listOperationMetadata(filters: {
  query?: string;
  method?: string;
  financialOnly?: boolean;
}): unknown[] {
  const search = filters.query?.toLowerCase();
  return Object.entries(API_OPERATIONS)
    .filter(([operation, definition]) => {
      if (filters.method && definition.method !== filters.method) return false;
      if (filters.financialOnly && !definition.financial) return false;
      if (
        search &&
        !operation.toLowerCase().includes(search) &&
        !definition.path.toLowerCase().includes(search)
      )
        return false;
      return true;
    })
    .slice(0, 100)
    .map(([operation, definition]) => operationMetadata(operation, definition));
}

function defaultRange(args: Record<string, unknown>): {
  start: string;
  end: string;
} {
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  return {
    start: stringArg(args, "start") ?? start,
    end: stringArg(args, "end") ?? end,
  };
}

const INSIGHT_BY_KIND: Record<string, InsightOperation> = {
  "expense-total": "insight.expense.total",
  "income-total": "insight.income.total",
  "transfer-total": "insight.transfer.total",
  "expense-category": "insight.expense.category",
  "income-category": "insight.income.category",
};

async function executeReadTool(
  name: string,
  argsValue: unknown,
  ctx: ToolContext,
): Promise<unknown> {
  const args = record(argsValue);
  switch (name) {
    case "firefly_summary": {
      const { start, end } = defaultRange(args);
      const response = await ctx.client.request("summary.basic", {
        query: { start, end },
      });
      return mapSummary(response.data);
    }
    case "firefly_list_accounts": {
      const response = await ctx.client.request("accounts.index", {
        query: {
          limit: numberArg(args, "limit", 50, 100),
          ...(stringArg(args, "type") ? { type: stringArg(args, "type") } : {}),
        },
      });
      return mapAccountList(response.data);
    }
    case "firefly_list_transactions": {
      const { start, end } = defaultRange(args);
      const response = await ctx.client.request("transactions.index", {
        query: {
          start,
          end,
          limit: numberArg(args, "limit", 25, 50),
          ...(stringArg(args, "type") && stringArg(args, "type") !== "all"
            ? { type: stringArg(args, "type") }
            : {}),
        },
      });
      return mapTransactionList(response.data);
    }
    case "firefly_search_transactions": {
      const response = await ctx.client.request("transactions.search", {
        query: {
          query: stringArg(args, "query", true),
          limit: numberArg(args, "limit", 25, 50),
        },
      });
      return mapTransactionList(response.data);
    }
    case "firefly_list_budgets": {
      const { start, end } = defaultRange(args);
      const response = await ctx.client.request("budgets.index", {
        query: {
          start,
          end,
          limit: numberArg(args, "limit", 50, 100),
        },
      });
      return mapBudgets(response.data);
    }
    case "firefly_list_budget_limits": {
      const budgetId = stringArg(args, "budgetId");
      const { start, end } = defaultRange(args);
      const response = budgetId
        ? await ctx.client.request("budgets.limits.index", {
            pathParameters: { budget: budgetId },
            query: { limit: 100 },
          })
        : await ctx.client.request("budget-limits.index", {
            query: { start, end, limit: 100 },
          });
      return mapBudgetLimits(response.data);
    }
    case "firefly_list_bills": {
      const response = await ctx.client.request("bills.index", {
        query: { limit: numberArg(args, "limit", 50, 100) },
      });
      return mapBills(response.data);
    }
    case "firefly_list_piggy_banks": {
      const response = await ctx.client.request("piggy-banks.index", {
        query: { limit: numberArg(args, "limit", 50, 100) },
      });
      return mapPiggyBanks(response.data);
    }
    case "firefly_piggy_events": {
      const response = await ctx.client.request("piggy-banks.events", {
        pathParameters: {
          piggyBank: stringArg(args, "piggyBankId", true)!,
        },
        query: { limit: numberArg(args, "limit", 50, 100) },
      });
      return response.data;
    }
    case "firefly_list_categories": {
      const response = await ctx.client.request("categories.index", {
        query: { limit: numberArg(args, "limit", 50, 100) },
      });
      return mapCategories(response.data);
    }
    case "firefly_list_tags": {
      const response = await ctx.client.request("tags.index", {
        query: { limit: numberArg(args, "limit", 50, 100) },
      });
      return mapTags(response.data);
    }
    case "firefly_balance_chart": {
      const { start, end } = defaultRange(args);
      const response = await ctx.client.request("chart.balance.balance", {
        query: { start, end },
      });
      return mapChart(response.data);
    }
    case "firefly_account_chart": {
      const { start, end } = defaultRange(args);
      const response = await ctx.client.request("chart.account.overview", {
        query: { start, end },
      });
      return mapChart(response.data);
    }
    case "firefly_insight": {
      const kind = stringArg(args, "kind", true)!;
      const operation = INSIGHT_BY_KIND[kind];
      if (!operation) throw new Error("Unknown insight kind.");
      const { start, end } = defaultRange(args);
      const response = await ctx.client.request(operation, {
        query: { start, end },
      });
      return mapInsights(response.data);
    }
    case "firefly_list_operations":
      return listOperationMetadata({
        query: stringArg(args, "query"),
        method: stringArg(args, "method"),
        financialOnly: args.financialOnly === true,
      });
    case "firefly_read_operation": {
      const operation = stringArg(args, "operation", true)!;
      if (!(operation in API_OPERATIONS))
        throw new Error("Unknown Firefly operation.");
      const id = operation as ApiOperation;
      const definition = API_OPERATIONS[id];
      if (definition.method !== "GET")
        throw new Error("firefly_read_operation only accepts GET operations.");
      if (isBlockedOperation(id))
        throw new Error("This operation is blocked by assistant policy.");
      const pathParameters = pathParametersFor(id, args.pathParameters);
      const query = queryFor(record(args.query));
      const response = await ctx.client.request(id, {
        pathParameters,
        query: searchParamsFor(query),
      });
      return response.data;
    }
    default:
      throw new Error(`Unknown read tool: ${name}`);
  }
}

function piggyDraft(args: Record<string, unknown>, today: string): PiggyDraft {
  return {
    name: stringArg(args, "name", true)!,
    targetAmount: stringArg(args, "targetAmount", true)!,
    startDate: stringArg(args, "startDate") ?? today,
    targetDate: stringArg(args, "targetDate") ?? "",
    order: "",
    notes: stringArg(args, "notes") ?? "",
    objectGroupTitle: "",
    accountId: stringArg(args, "accountId", true)!,
    currentAmount: stringArg(args, "initialAmount") ?? "0",
    currencyCode: stringArg(args, "currencyCode", true)!.toUpperCase(),
  };
}

async function preparePiggyWrite(
  name: string,
  argsValue: unknown,
  ctx: ToolContext,
): Promise<PreparedWrite> {
  const args = record(argsValue);
  if (name === "firefly_create_piggy_bank") {
    const today = new Date().toISOString().slice(0, 10);
    const draft = piggyDraft(args, today);
    const validation = validatePiggyDraft(draft);
    if (!validation.ok)
      throw new Error(Object.values(validation.errors).join(" "));
    return {
      operation: "piggy-banks.store",
      body: piggyPayload(draft),
      summary: `Create savings goal "${draft.name}" with target ${draft.targetAmount} ${draft.currencyCode} in account ${draft.accountId}.`,
    };
  }

  const piggyBankId = stringArg(args, "piggyBankId", true)!;
  const amount = stringArg(args, "amount", true)!;
  if (!/^\d+(?:\.\d+)?$/.test(amount) || Number(amount) <= 0)
    throw new Error("amount must be a positive decimal string.");
  const piggy = await getPiggyBank(ctx.client, piggyBankId);
  if (!piggy) throw new Error("The savings goal was not found.");
  const requestedAccountId = stringArg(args, "accountId");
  const account = requestedAccountId
    ? piggy.accounts.find((entry) => entry.accountId === requestedAccountId)
    : piggy.accounts[0];
  if (!account)
    throw new Error("The account is not linked to this savings goal.");

  const nextAmount = adjustPiggyAmount(
    account.currentAmount,
    amount,
    account.decimalPlaces,
    name === "firefly_add_piggy_money" ? "add" : "remove",
  );
  const accounts = piggy.accounts.map((entry) =>
    entry.accountId === account.accountId
      ? { account_id: entry.accountId, current_amount: nextAmount }
      : { account_id: entry.accountId, current_amount: entry.currentAmount },
  );
  const body = {
    name: piggy.name,
    target_amount: piggy.targetAmount,
    transaction_currency_code: account.currencyCode,
    start_date: piggy.startDate ?? new Date().toISOString().slice(0, 10),
    ...(piggy.targetDate ? { target_date: piggy.targetDate } : {}),
    ...(piggy.order ? { order: piggy.order } : {}),
    ...(piggy.notes ? { notes: piggy.notes } : {}),
    ...(piggy.objectGroupTitle
      ? { object_group_title: piggy.objectGroupTitle }
      : {}),
    accounts,
  };
  return {
    operation: "piggy-banks.update",
    pathParameters: { piggyBank: piggy.id },
    body,
    summary: `${name === "firefly_add_piggy_money" ? "Add" : "Remove"} ${amount} ${account.currencyCode} ${name === "firefly_add_piggy_money" ? "to" : "from"} "${piggy.name}" (${account.name}): ${account.currentAmount} -> ${nextAmount}.`,
  };
}

function prepareGenericWrite(
  argsValue: unknown,
  ctx: ToolContext,
): PreparedWrite {
  const args = record(argsValue);
  const operation = stringArg(args, "operation", true)!;
  if (!(operation in API_OPERATIONS))
    throw new Error("Unknown Firefly operation.");
  const id = operation as ApiOperation;
  const definition = API_OPERATIONS[id];
  if (definition.method === "GET")
    throw new Error("Use firefly_read_operation for GET operations.");
  if (CURATED_WRITE_OPERATIONS.has(id))
    throw new Error("Use the curated piggy-bank tools for piggy-bank changes.");
  if (isBlockedOperation(id))
    throw new Error("This operation is blocked by assistant policy.");
  if (!ctx.settings.writeToolsEnabled)
    throw new Error("Write tools are disabled in assistant settings.");
  if (isRiskyOperation(id) && !ctx.settings.riskyWritesEnabled)
    throw new Error("Risky writes are disabled in assistant settings.");
  const pathParameters = pathParametersFor(id, args.pathParameters);
  const query = queryFor(record(args.query));
  const body = bodyFor(args.body);
  if ("body" in definition && body === undefined)
    throw new Error("This operation requires a JSON body.");
  return {
    operation: id,
    pathParameters,
    query,
    body,
    summary: `${definition.method} ${definition.path} (${id}).`,
  };
}

export async function prepareToolCall(
  name: string,
  args: unknown,
  ctx: ToolContext,
): Promise<PreparedTool> {
  const definition = availableTools(ctx.settings).find(
    (candidate) => candidate.name === name,
  );
  if (!definition) throw new Error(`Unknown or disabled tool: ${name}`);
  if (definition.kind === "read") {
    return {
      kind: "read",
      data: await executeReadTool(name, args, ctx),
    };
  }
  if (name === "firefly_request_write") {
    return { kind: "write", write: prepareGenericWrite(args, ctx) };
  }
  return { kind: "write", write: await preparePiggyWrite(name, args, ctx) };
}

export async function executePreparedWrite(
  write: PreparedWrite,
  ctx: ToolContext,
): Promise<unknown> {
  const response = await ctx.client.request(write.operation, {
    pathParameters: write.pathParameters,
    query: searchParamsFor(write.query),
    body: write.body,
  });
  return response.data;
}

export function toolResultText(value: unknown): string {
  let text: string;
  if (typeof value === "string") text = value;
  else {
    try {
      text = JSON.stringify(value);
    } catch {
      text = String(value);
    }
  }
  if (text.length <= ASSISTANT_LIMITS.maxToolResultBytes) return text;
  return `${text.slice(0, ASSISTANT_LIMITS.maxToolResultBytes)}\n[truncated]`;
}

export function toolNames(settings: AssistantSettings): string[] {
  return availableTools(settings).map((definition) => definition.name);
}
