export type AssistantReasoningEffort = "minimal" | "low" | "medium" | "high";

export interface AssistantSettingsView {
  provider: string;
  baseUrl: string;
  model: string;
  reasoningEffort: AssistantReasoningEffort;
  temperature: number;
  maxOutputTokens: number;
  writeToolsEnabled: boolean;
  riskyWritesEnabled: boolean;
  historyRetentionDays: number;
  configured: boolean;
  apiKeyHint: string | null;
}

export interface AssistantConversationSummaryView {
  id: string;
  title: string;
  model: string;
  reasoningEffort: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface AssistantToolEventView {
  name: string;
  status: "read" | "approved" | "denied" | "error";
  operation?: string;
  summary?: string;
}

export interface AssistantMessageView {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  toolEvents: AssistantToolEventView[];
}

export interface AssistantConversationView extends AssistantConversationSummaryView {
  messages: AssistantMessageView[];
}

export interface AssistantApprovalView {
  approvalId: string;
  operation: string;
  method: string;
  path: string;
  query?: Record<string, string | string[]>;
  body?: unknown;
  summary: string;
}
