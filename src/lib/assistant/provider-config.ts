import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";
import {
  ASSISTANT_DEFAULTS,
  isReasoningEffort,
  type ReasoningEffort,
} from "./config.ts";

export interface AssistantSettings {
  provider: string;
  baseUrl: string;
  model: string;
  reasoningEffort: ReasoningEffort;
  temperature: number;
  maxOutputTokens: number;
  writeToolsEnabled: boolean;
  riskyWritesEnabled: boolean;
  historyRetentionDays: number;
}

export interface StoredProviderSettings extends AssistantSettings {
  apiKeyCiphertext: Uint8Array;
  apiKeyIv: Uint8Array;
  apiKeyTag: Uint8Array;
  apiKeyHint: string;
}

export interface PublicAssistantSettings extends AssistantSettings {
  configured: boolean;
  apiKeyHint: string | null;
}

export interface EncryptedApiKey {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  tag: Uint8Array;
}

function encryptionKey(): Buffer {
  const secret =
    process.env.SESSION_SECRET ||
    "default-insecure-dev-session-key-change-me-32b";
  return scryptSync(secret, "firefly-assistant-key", 32);
}

export function encryptApiKey(
  apiKey: string,
  ownerKey: string,
): EncryptedApiKey {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(ownerKey, "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);
  return {
    ciphertext: new Uint8Array(ciphertext),
    iv: new Uint8Array(iv),
    tag: new Uint8Array(cipher.getAuthTag()),
  };
}

export function decryptApiKey(
  ciphertext: Uint8Array,
  iv: Uint8Array,
  tag: Uint8Array,
  ownerKey: string,
): string | null {
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(iv),
    );
    decipher.setAAD(Buffer.from(ownerKey, "utf8"));
    decipher.setAuthTag(Buffer.from(tag));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertext)),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function defaultAssistantSettings(): AssistantSettings {
  return {
    provider: ASSISTANT_DEFAULTS.provider,
    baseUrl: ASSISTANT_DEFAULTS.baseUrl,
    model: ASSISTANT_DEFAULTS.model,
    reasoningEffort: ASSISTANT_DEFAULTS.reasoningEffort,
    temperature: ASSISTANT_DEFAULTS.temperature,
    maxOutputTokens: ASSISTANT_DEFAULTS.maxOutputTokens,
    writeToolsEnabled: ASSISTANT_DEFAULTS.writeToolsEnabled,
    riskyWritesEnabled: ASSISTANT_DEFAULTS.riskyWritesEnabled,
    historyRetentionDays: ASSISTANT_DEFAULTS.historyRetentionDays,
  };
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".lan") || host.endsWith(".local"))
    return true;
  if (host === "::1") return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  return false;
}

export function validateProviderBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Enter a valid provider URL.");
  }
  const host = url.hostname.toLowerCase();
  if (
    host === "169.254.169.254" ||
    host.startsWith("169.254.") ||
    host === "metadata.google.internal"
  ) {
    throw new Error("Link-local metadata addresses are not allowed.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Provider URL must use http or https.");
  }
  if (url.protocol === "http:" && !isPrivateHost(host)) {
    throw new Error("Use https for public providers.");
  }
  if (url.username || url.password) {
    throw new Error("Do not put credentials in the provider URL.");
  }
  return url.toString().replace(/\/$/, "");
}

function boolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function numberInRange(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function parseAssistantSettings(
  input: unknown,
  existing: AssistantSettings = defaultAssistantSettings(),
): AssistantSettings {
  const record =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {};
  const baseUrl =
    typeof record.baseUrl === "string"
      ? validateProviderBaseUrl(record.baseUrl)
      : existing.baseUrl;
  const model =
    typeof record.model === "string" && record.model.trim()
      ? record.model.trim()
      : existing.model;
  const reasoningEffort = isReasoningEffort(record.reasoningEffort)
    ? record.reasoningEffort
    : existing.reasoningEffort;
  return {
    provider:
      typeof record.provider === "string" && record.provider.trim()
        ? record.provider.trim()
        : existing.provider,
    baseUrl,
    model,
    reasoningEffort,
    temperature: numberInRange(record.temperature, existing.temperature, 0, 2),
    maxOutputTokens: Math.round(
      numberInRange(
        record.maxOutputTokens,
        existing.maxOutputTokens,
        256,
        8192,
      ),
    ),
    writeToolsEnabled: boolean(
      record.writeToolsEnabled,
      existing.writeToolsEnabled,
    ),
    riskyWritesEnabled: boolean(
      record.riskyWritesEnabled,
      existing.riskyWritesEnabled,
    ),
    historyRetentionDays: Math.round(
      numberInRange(
        record.historyRetentionDays,
        existing.historyRetentionDays,
        1,
        365,
      ),
    ),
  };
}

export function publicAssistantSettings(
  settings: StoredProviderSettings | null,
): PublicAssistantSettings {
  if (!settings) {
    return {
      ...defaultAssistantSettings(),
      configured: false,
      apiKeyHint: null,
    };
  }
  return {
    provider: settings.provider,
    baseUrl: settings.baseUrl,
    model: settings.model,
    reasoningEffort: settings.reasoningEffort,
    temperature: settings.temperature,
    maxOutputTokens: settings.maxOutputTokens,
    writeToolsEnabled: settings.writeToolsEnabled,
    riskyWritesEnabled: settings.riskyWritesEnabled,
    historyRetentionDays: settings.historyRetentionDays,
    configured: settings.apiKeyCiphertext.length > 0,
    apiKeyHint: settings.apiKeyHint || null,
  };
}

export function apiKeyHint(apiKey: string): string {
  const normalized = apiKey.trim();
  if (!normalized) return "";
  return `••••${normalized.slice(-4)}`;
}
