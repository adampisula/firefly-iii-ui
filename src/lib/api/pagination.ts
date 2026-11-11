import {
  API_OPERATIONS,
  resolveOperationPath,
  type ApiOperation,
} from "./operations.ts";

export function safePaginationQuery(
  nextLink: string,
  apiBase: string | URL,
  operation: ApiOperation,
  pathParameters: Readonly<Record<string, string>> = {},
  originalQuery?: string,
): URLSearchParams {
  const base = new URL(apiBase);
  const normalizedPath = base.pathname.replace(/\/+$/, "");
  const path = resolveOperationPath(operation, pathParameters);
  const expectedPath = `${normalizedPath}/${path}`;
  const target = new URL(nextLink, `${base.origin}${expectedPath}`);

  if (
    target.origin !== base.origin ||
    target.pathname !== expectedPath ||
    target.username ||
    target.password ||
    target.hash
  ) {
    throw new TypeError("The backend supplied an unsafe pagination link.");
  }

  const query = new URLSearchParams(target.searchParams);
  if (
    operation === "transactions.search" &&
    originalQuery &&
    !query.has("query")
  ) {
    query.delete("search");
    query.set("query", originalQuery);
  }
  return query;
}

export function operationPath(operation: ApiOperation): string {
  return `${API_OPERATIONS[operation].path}`;
}
