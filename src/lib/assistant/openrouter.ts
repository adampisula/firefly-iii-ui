import { ASSISTANT_LIMITS } from "./config.ts";
import type { AssistantSettings } from "./provider-config.ts";

export interface OpenAiToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatResult {
  content: string;
  toolCalls: OpenAiToolCall[];
  finishReason: string | null;
  usage: unknown;
}

export interface ProviderCredentials {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  reasoningEffort: string;
}

function endpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function providerError(response: Response): Promise<Error> {
  let detail = "";
  try {
    const payload = (await response.json()) as {
      error?: { message?: string };
      message?: string;
    };
    detail = payload.error?.message ?? payload.message ?? "";
  } catch {
    // Keep the status-only message.
  }
  const suffix = detail ? `: ${detail.slice(0, 300)}` : "";
  if (response.status === 401)
    return new Error(`The provider rejected the API key (401)${suffix}`);
  if (response.status === 402)
    return new Error(
      `The provider account has insufficient credits (402)${suffix}`,
    );
  if (response.status === 429)
    return new Error(`The provider rate limit was reached (429)${suffix}`);
  return new Error(`The provider request failed (${response.status})${suffix}`);
}

function normalizeContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === "string") return part;
        if (
          typeof part === "object" &&
          part !== null &&
          "text" in part &&
          typeof (part as { text?: unknown }).text === "string"
        )
          return (part as { text: string }).text;
        return "";
      })
      .join("");
  }
  return "";
}

export async function chatCompletion(
  credentials: ProviderCredentials,
  messages: readonly Record<string, unknown>[],
  tools: readonly Record<string, unknown>[],
  signal?: AbortSignal,
): Promise<ChatResult> {
  const timeout = AbortSignal.timeout(ASSISTANT_LIMITS.providerTimeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const response = await fetch(
    endpoint(credentials.baseUrl, "chat/completions"),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: credentials.model,
        messages,
        ...(tools.length
          ? {
              tools,
              tool_choice: "auto",
              parallel_tool_calls: false,
            }
          : {}),
        temperature: credentials.temperature,
        max_tokens: credentials.maxOutputTokens,
        reasoning: {
          effort: credentials.reasoningEffort,
          exclude: true,
        },
        stream: false,
      }),
      signal: combined,
      cache: "no-store",
    },
  );
  if (!response.ok) throw await providerError(response);
  const payload = (await response.json()) as {
    choices?: {
      message?: {
        content?: unknown;
        tool_calls?: unknown;
      };
      finish_reason?: string;
    }[];
    usage?: unknown;
  };
  const choice = payload.choices?.[0];
  const message = choice?.message;
  const content = normalizeContent(message?.content);
  const toolCalls: OpenAiToolCall[] = Array.isArray(message?.tool_calls)
    ? message.tool_calls.flatMap((value) => {
        if (typeof value !== "object" || value === null) return [];
        const call = value as Record<string, unknown>;
        const fn =
          typeof call.function === "object" && call.function !== null
            ? (call.function as Record<string, unknown>)
            : null;
        if (
          typeof call.id !== "string" ||
          !fn ||
          typeof fn.name !== "string" ||
          typeof fn.arguments !== "string"
        )
          return [];
        return [
          {
            id: call.id,
            type: "function" as const,
            function: { name: fn.name, arguments: fn.arguments },
          },
        ];
      })
    : [];
  if (!content && toolCalls.length === 0) {
    if (choice?.finish_reason === "length") {
      throw new Error(
        "The model used its entire output budget while reasoning. Increase the output-token limit or lower the reasoning effort.",
      );
    }
    throw new Error("The provider returned an empty response.");
  }
  return {
    content,
    toolCalls,
    finishReason: choice?.finish_reason ?? null,
    usage: payload.usage ?? null,
  };
}

export interface ModelOption {
  id: string;
  name: string;
  supportsTools: boolean;
  supportsReasoning: boolean;
}

export async function listModels(
  baseUrl: string,
  apiKey: string,
): Promise<ModelOption[]> {
  const response = await fetch(endpoint(baseUrl, "models"), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
  if (!response.ok) throw await providerError(response);
  const payload = (await response.json()) as {
    data?: {
      id?: unknown;
      name?: unknown;
      supported_parameters?: unknown;
    }[];
  };
  return (payload.data ?? []).flatMap((model) => {
    if (typeof model.id !== "string") return [];
    const parameters = Array.isArray(model.supported_parameters)
      ? model.supported_parameters.filter(
          (value): value is string => typeof value === "string",
        )
      : [];
    return [
      {
        id: model.id,
        name: typeof model.name === "string" ? model.name : model.id,
        supportsTools: parameters.includes("tools"),
        supportsReasoning:
          parameters.includes("reasoning") ||
          parameters.includes("reasoning_effort"),
      },
    ];
  });
}

export function credentialsFromSettings(
  settings: AssistantSettings,
  apiKey: string,
): ProviderCredentials {
  return {
    baseUrl: settings.baseUrl,
    apiKey,
    model: settings.model,
    temperature: settings.temperature,
    maxOutputTokens: settings.maxOutputTokens,
    reasoningEffort: settings.reasoningEffort,
  };
}
