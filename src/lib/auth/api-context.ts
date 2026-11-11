import { createApiClient } from "../api/client";
import {
  isCompatibilityCurrent,
  normalizeApiBase,
  verifyBackendCompatibility,
  type CompatibilityState,
} from "../api/compatibility";
import { getServerEnvironment } from "../server-env";
import { getCurrentAuth, type AuthContext } from "./service";

const MAX_CACHED_IDENTITIES = 50;
const compatibilityCache = new Map<string, CompatibilityState>();

export interface SessionApiContext {
  auth: AuthContext & { session: NonNullable<AuthContext["session"]> };
  compatibility: CompatibilityState;
  client: ReturnType<typeof createApiClient>;
}

function rememberCompatibility(key: string, state: CompatibilityState) {
  compatibilityCache.delete(key);
  compatibilityCache.set(key, state);
  while (compatibilityCache.size > MAX_CACHED_IDENTITIES) {
    const oldest = compatibilityCache.keys().next().value;
    if (oldest === undefined) break;
    compatibilityCache.delete(oldest);
  }
}

export function forgetCompatibility(identity: string) {
  for (const key of compatibilityCache.keys()) {
    if (key.startsWith(`${identity}|`)) compatibilityCache.delete(key);
  }
}

export async function getSessionApiContext(): Promise<SessionApiContext | null> {
  const auth = await getCurrentAuth();
  if (!auth.session || !auth.accessToken) return null;

  const environment = getServerEnvironment();
  const backendApiBase = normalizeApiBase(environment.backendInternalApiUrl);
  const cacheKey = `${auth.session.identity}|${backendApiBase}`;

  let compatibility = compatibilityCache.get(cacheKey);
  if (
    !isCompatibilityCurrent(
      compatibility,
      auth.session.identity,
      backendApiBase,
    )
  ) {
    compatibility = await verifyBackendCompatibility(
      async () => {
        const response = await fetch(new URL(`${backendApiBase}/about`), {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
            Accept: "application/json, application/vnd.api+json",
          },
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      auth.session.identity,
      backendApiBase,
    );
    rememberCompatibility(cacheKey, compatibility);
  }

  const accessToken = auth.accessToken;
  const client = createApiClient({
    credentialProvider: {
      getAccessToken: async () => accessToken,
    },
    sessionIdentity: auth.session.identity,
    getCompatibilityState: () => compatibility,
  });

  return {
    auth: auth as SessionApiContext["auth"],
    compatibility,
    client,
  };
}
