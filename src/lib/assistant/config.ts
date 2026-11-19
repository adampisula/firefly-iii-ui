export const ASSISTANT_DEFAULTS = {
  provider: "openrouter",
  baseUrl: "https://openrouter.ai/api/v1",
  model: "deepseek/deepseek-v4.1-flash-1017",
  reasoningEffort: "medium",
  temperature: 0.2,
  maxOutputTokens: 2048,
  historyRetentionDays: 30,
  writeToolsEnabled: false,
  riskyWritesEnabled: false,
} as const;

export const ASSISTANT_LIMITS = {
  maxToolRounds: 6,
  maxToolResultBytes: 32 * 1024,
  providerTimeoutMs: 120_000,
  approvalTimeoutMs: 300_000,
  maxHistoryMessages: 20,
  maxConversations: 100,
  maxMessagesPerConversation: 200,
  requestsPerHour: 30,
  maxBodyBytes: 256 * 1024,
} as const;

export const REASONING_EFFORTS = ["minimal", "low", "medium", "high"] as const;

export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

export function assistantEnabled(): boolean {
  return process.env.AI_ASSISTANT_ENABLED === "true";
}

export function isReasoningEffort(value: unknown): value is ReasoningEffort {
  return (
    typeof value === "string" &&
    (REASONING_EFFORTS as readonly string[]).includes(value)
  );
}
