import { normalizeApiBase } from "./compatibility.ts";
import type { ApiQuery } from "./client.ts";
import { API_OPERATIONS, type ApiOperation } from "./operations.ts";

function canonicalQuery(query: ApiQuery | undefined): string {
  const parameters =
    query instanceof URLSearchParams
      ? new URLSearchParams(query)
      : new URLSearchParams(
          Object.entries(query ?? {}).flatMap(([key, value]) =>
            value === undefined || value === null ? [] : [[key, String(value)]],
          ),
        );
  const entries = [...parameters.entries()].sort(
    ([leftKey, leftValue], [rightKey, rightValue]) => {
      const keyOrder = leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
      if (keyOrder !== 0) return keyOrder;
      return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
    },
  );
  return JSON.stringify(entries);
}

export function apiQueryKey(
  sessionIdentity: string,
  apiBase: string | URL,
  operation: ApiOperation,
  query?: ApiQuery,
  pathParameters: Readonly<Record<string, string>> = {},
): readonly string[] {
  return [
    "firefly",
    sessionIdentity,
    normalizeApiBase(apiBase),
    operation,
    JSON.stringify(
      Object.entries(pathParameters).sort(([a], [b]) =>
        a < b ? -1 : a > b ? 1 : 0,
      ),
    ),
    canonicalQuery(query),
  ];
}

export type FinancialQueryDomain = "accounts" | "summary" | "transactions";

export function invalidatedDomainsForMutation(
  operation: ApiOperation,
): readonly FinancialQueryDomain[] {
  if (
    API_OPERATIONS[operation].method !== "GET" &&
    operation.startsWith("transactions.")
  ) {
    return ["transactions", "accounts", "summary"];
  }
  return [];
}

export function isPrivateApiQueryKey(key: readonly unknown[]): boolean {
  return key[0] === "firefly" && typeof key[1] === "string";
}
