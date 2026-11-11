export const API_OPERATIONS = {
  "about.index": { method: "GET", path: "about", financial: false },
  "about.user": { method: "GET", path: "about/user", financial: false },
  "accounts.index": { method: "GET", path: "accounts", financial: true },
  "accounts.store": {
    method: "POST",
    path: "accounts",
    body: "json",
    financial: true,
  },
  "accounts.show": {
    method: "GET",
    path: "accounts/{account}",
    pathParams: ["account"],
    financial: true,
  },
  "currencies.index": { method: "GET", path: "currencies", financial: false },
  "currencies.primary": {
    method: "POST",
    path: "currencies/{currencyCode}/primary",
    pathParams: ["currencyCode"],
    pathParamPattern: "currency-code",
    financial: true,
  },
  "preferences.store": {
    method: "POST",
    path: "preferences",
    body: "json",
    financial: true,
  },
  "summary.basic": { method: "GET", path: "summary/basic", financial: true },
  "transactions.index": {
    method: "GET",
    path: "transactions",
    financial: true,
  },
  "transactions.show": {
    method: "GET",
    path: "transactions/{transactionGroup}",
    pathParams: ["transactionGroup"],
    financial: true,
  },
  "transactions.search": {
    method: "GET",
    path: "search/transactions",
    financial: true,
  },
  "transactions.store": {
    method: "POST",
    path: "transactions",
    body: "json",
    financial: true,
  },
  "transactions.update": {
    method: "PUT",
    path: "transactions/{transactionGroup}",
    pathParams: ["transactionGroup"],
    body: "json",
    financial: true,
  },
  "transactions.delete": {
    method: "DELETE",
    path: "transactions/{transactionGroup}",
    pathParams: ["transactionGroup"],
    financial: true,
  },
} as const;

export type ApiOperation = keyof typeof API_OPERATIONS;
export type ApiMethod = (typeof API_OPERATIONS)[ApiOperation]["method"];

export function resolveOperationPath(
  operation: ApiOperation,
  parameters: Readonly<Record<string, string>> = {},
): string {
  const definition = API_OPERATIONS[operation];
  const required = "pathParams" in definition ? definition.pathParams : [];
  const supplied = Object.keys(parameters);

  if (
    required.length !== supplied.length ||
    required.some((key) => !(key in parameters))
  ) {
    throw new TypeError(`Invalid path parameters for ${operation}.`);
  }

  return definition.path.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = parameters[key];
    const pattern =
      "pathParamPattern" in definition
        ? definition.pathParamPattern
        : "numeric";
    if (pattern === "currency-code") {
      if (typeof value !== "string" || !/^[A-Za-z]{3}$/.test(value)) {
        throw new TypeError(
          `Path parameter ${key} must be a three-letter currency code.`,
        );
      }
      return encodeURIComponent(value.toUpperCase());
    }
    if (typeof value !== "string" || !/^\d+$/.test(value)) {
      throw new TypeError(
        `Path parameter ${key} must be a numeric Firefly ID.`,
      );
    }
    return encodeURIComponent(value);
  });
}
