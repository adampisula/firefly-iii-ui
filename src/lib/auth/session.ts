import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

export const SESSION_COOKIE_NAME = "ff_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface UserSessionData {
  identity: string; // unique session identity id
  user: {
    id: string;
    email: string;
    role: string | null;
    blocked: boolean;
  };
  authType: "pat" | "oauth";
  patToken?: string;
  oauthTokens?: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  };
  createdAt: number;
}

function getEncryptionKey(): Buffer {
  const secret =
    process.env.SESSION_SECRET ||
    "default-insecure-dev-session-key-change-me-32b";
  return scryptSync(secret, "firefly-salt", 32);
}

export function encryptSession(data: UserSessionData): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = JSON.stringify(data);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Return base64 payload: iv (12 bytes) + tag (16 bytes) + ciphertext
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptSession(cookieValue: string): UserSessionData | null {
  try {
    const raw = Buffer.from(cookieValue, "base64url");
    if (raw.length < 28) return null; // 12 iv + 16 tag minimum
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);

    const key = getEncryptionKey();
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString("utf8")) as UserSessionData;
  } catch {
    return null;
  }
}
