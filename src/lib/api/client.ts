import { getServerEnvironment } from "../server-env.ts";
import {
  assertFinancialCompatibility,
  normalizeApiBase,
  type CompatibilityState,
} from "./compatibility.ts";
import {
  API_OPERATIONS,
  resolveOperationPath,
  type ApiOperation,
} from "./operations.ts";

if (typeof window !== "undefined") {
  throw new Error("Firefly API client is server-only.");
}

export interface ApiCredentialProvider {
  getAccessToken(): Promise<string | null>;
}

export interface ApiClientOptions {
  credentialProvider: ApiCredentialProvider;
  sessionIdentity: string;
  getCompatibilityState(): CompatibilityState | undefined;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export type ApiQueryValue = string | number | boolean | null | undefined;
export type ApiQuery =
  | URLSearchParams
  | Readonly<Record<string, ApiQueryValue>>;
export type ApiBody = unknown | ReadableStream<Uint8Array> | null;

export interface ApiResponse<T = unknown> {
  status: number;
  headers: Headers;
  data: T;
}

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number | undefined;
  readonly retryable: boolean;
  readonly fieldPaths: readonly string[];

  constructor(
    message: string,
    code: string,
    status?: number,
    retryable = false,
    fieldPaths: readonly string[] = [],
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.fieldPaths = fieldPaths;
  }
}

function queryParams(query: ApiQuery | undefined): URLSearchParams {
  if (!query) return new URLSearchParams();
  if (query instanceof URLSearchParams) return new URLSearchParams(query);

  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null)
      result.append(key, String(value));
  }
  return result;
}

function errorForStatus(
  status: number,
  retryable: boolean,
  fieldPaths: readonly string[] = [],
): ApiClientError {
  const messageByStatus: Readonly<Record<number, string>> = {
    401: "The backend rejected this request or the connected user lacks permission.",
    404: "The requested Firefly resource was not found.",
    406: "The backend does not support the requested response format.",
    409: "The request conflicts with the current Firefly data.",
    415: "The backend rejected the request content type.",
    422: "The backend rejected one or more request fields.",
  };
  const message =
    messageByStatus[status] ??
    (status >= 500
      ? "Firefly could not complete the request. Check the connection before trying again."
      : "The Firefly request could not be completed.");
  return new ApiClientError(
    message,
    `upstream_${status}`,
    status,
    retryable && (status === 408 || status === 429 || status >= 500),
    fieldPaths,
  );
}

async function fieldPathsFromResponse(response: Response): Promise<string[]> {
  try {
    const payload: unknown = await response.clone().json();
    if (typeof payload !== "object" || payload === null) return [];
    const root = payload as Record<string, unknown>;
    const errors = root.errors;
    if (typeof errors !== "object" || errors === null || Array.isArray(errors))
      return [];
    return Object.keys(errors)
      .filter((path) =>
        /^[a-zA-Z][a-zA-Z0-9_-]*(?:(?:\.[a-zA-Z0-9_-]+)|(?:\[\d+\])){0,20}$/.test(
          path,
        ),
      )
      .slice(0, 50);
  } catch {
    return [];
  }
}

async function decodeBody(response: Response): Promise<ApiBody> {
  if (response.status === 204 || response.status === 205 || !response.body)
    return null;

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("json")) {
    try {
      return await response.json();
    } catch {
      throw new ApiClientError(
        "Firefly returned an unreadable JSON response.",
        "invalid_upstream_json",
        response.status,
      );
    }
  }
  if (contentType.startsWith("text/")) return response.text();
  return response.body;
}

export function createApiClient(options: ApiClientOptions) {
  const environment = getServerEnvironment();
  const base = environment.backendInternalApiUrl;
  const normalizedBase = normalizeApiBase(base);
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 10_000;

  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) {
    throw new RangeError(
      "API timeout must be between 1 and 60000 milliseconds.",
    );
  }

  return {
    async request<T = unknown>(
      operation: ApiOperation,
      request: {
        pathParameters?: Readonly<Record<string, string>>;
        query?: ApiQuery;
        body?: unknown;
        signal?: AbortSignal;
      } = {},
    ): Promise<ApiResponse<T>> {
      const definition = API_OPERATIONS[operation];
      const hasBody = request.body !== undefined;
      if (definition.method === "GET" && hasBody) {
        throw new TypeError("GET operations cannot include a request body.");
      }
      if ("body" in definition && !hasBody) {
        throw new TypeError(`${operation} requires a JSON body.`);
      }
      if (!("body" in definition) && definition.method !== "GET" && hasBody) {
        throw new TypeError(`${operation} does not accept a request body.`);
      }
      if (definition.financial) {
        assertFinancialCompatibility(
          options.getCompatibilityState(),
          options.sessionIdentity,
          normalizedBase,
        );
      }

      const path = resolveOperationPath(operation, request.pathParameters);
      const url = new URL(path, `${normalizedBase}/`);
      url.search = queryParams(request.query).toString();

      const token = await options.credentialProvider.getAccessToken();
      if (!token) {
        throw new ApiClientError(
          "Connect a Firefly account to continue.",
          "missing_credential",
        );
      }

      const headers = new Headers({
        Accept: "application/json, application/vnd.api+json",
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-store",
      });
      const init: RequestInit = {
        method: definition.method,
        headers,
        cache: "no-store",
        redirect: "error",
        signal: request.signal
          ? AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)])
          : AbortSignal.timeout(timeoutMs),
      };
      if (hasBody) {
        headers.set("Content-Type", "application/json");
        init.body = JSON.stringify(request.body);
      } else if (
        definition.method !== "GET" &&
        definition.method !== "DELETE"
      ) {
        // Firefly rejects JSON API POST/PUT requests without a JSON content type.
        headers.set("Content-Type", "application/json");
        init.body = "{}";
      }

      let response: Response;
      try {
        response = await fetchImpl(url, init);
      } catch (error) {
        if (request.signal?.aborted) {
          throw new ApiClientError(
            "The Firefly request was cancelled.",
            "request_aborted",
          );
        }
        const timedOut =
          error instanceof Error && error.name === "TimeoutError";
        throw new ApiClientError(
          timedOut
            ? "The Firefly request timed out. Check the connection before trying again."
            : "Firefly could not be reached. Check the connection before trying again.",
          timedOut ? "upstream_timeout" : "upstream_unavailable",
          undefined,
          definition.method === "GET",
        );
      }

      if (!response.ok) {
        throw errorForStatus(
          response.status,
          definition.method === "GET",
          await fieldPathsFromResponse(response),
        );
      }
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set("Cache-Control", "no-store");
      return {
        status: response.status,
        headers: responseHeaders,
        data: (await decodeBody(response)) as T,
      };
    },
  };
}
