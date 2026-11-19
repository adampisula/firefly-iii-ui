import { getCurrentAuth } from "../auth/service.ts";
import { getOwnerKey } from "../user-data/owner-key.ts";
import { getServerEnvironment } from "../server-env.ts";
import { ASSISTANT_LIMITS } from "./config.ts";

export interface AssistantUser {
  userId: string;
  ownerKey: string;
  email: string;
  accessToken: string;
}

export async function currentAssistantUser(): Promise<AssistantUser | null> {
  const auth = await getCurrentAuth();
  if (!auth.session || !auth.accessToken) return null;
  return {
    userId: auth.session.user.id,
    ownerKey: getOwnerKey(auth.session.user.id),
    email: auth.session.user.email,
    accessToken: auth.accessToken,
  };
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return origin === getServerEnvironment().frontendPublicUrl.origin;
  } catch {
    return false;
  }
}

const requestLog = new Map<string, number[]>();

export function allowAssistantRequest(ownerKey: string): boolean {
  const now = Date.now();
  const cutoff = now - 60 * 60 * 1000;
  const previous = (requestLog.get(ownerKey) ?? []).filter(
    (timestamp) => timestamp > cutoff,
  );
  if (previous.length >= ASSISTANT_LIMITS.requestsPerHour) {
    requestLog.set(ownerKey, previous);
    return false;
  }
  previous.push(now);
  requestLog.set(ownerKey, previous);
  return true;
}
