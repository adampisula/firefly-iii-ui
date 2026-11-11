import compatibilityManifest from "../../../backend-compatibility.json" with { type: "json" };

export const MAX_COMPATIBILITY_AGE_MS = 60_000;
export const SUPPORTED_BACKEND_VERSION =
  compatibilityManifest.backend.supportedVersion;

export type CompatibilityState =
  | {
      status: "verified";
      sessionIdentity: string;
      backendApiBase: string;
      backendVersion: string;
      checkedAt: number;
    }
  | {
      status: "blocked";
      reason: "unverifiable" | "mismatch";
      sessionIdentity: string;
      backendApiBase: string;
      backendVersion?: string;
      checkedAt: number;
    };

export function normalizeApiBase(value: string | URL): string {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new TypeError("The internal API base must be a trusted HTTP(S) URL.");
  }
  const path = url.pathname.replace(/\/+$/, "");
  if (path !== compatibilityManifest.backend.apiPath) {
    throw new TypeError(
      `The internal API base must end in ${compatibilityManifest.backend.apiPath}.`,
    );
  }
  return `${url.origin}${path}`;
}

export function isCompatibilityCurrent(
  state: CompatibilityState | undefined,
  sessionIdentity: string,
  backendApiBase: string | URL,
  now = Date.now(),
): state is Extract<CompatibilityState, { status: "verified" }> {
  if (!state || state.status !== "verified") return false;

  let normalizedBase: string;
  try {
    normalizedBase = normalizeApiBase(backendApiBase);
  } catch {
    return false;
  }

  return (
    state.sessionIdentity === sessionIdentity &&
    state.backendApiBase === normalizedBase &&
    state.backendVersion === SUPPORTED_BACKEND_VERSION &&
    Number.isFinite(state.checkedAt) &&
    state.checkedAt <= now &&
    now - state.checkedAt <= MAX_COMPATIBILITY_AGE_MS
  );
}

export async function verifyBackendCompatibility(
  getAbout: () => Promise<unknown>,
  sessionIdentity: string,
  backendApiBase: string | URL,
  now = Date.now(),
): Promise<CompatibilityState> {
  const normalizedBase = normalizeApiBase(backendApiBase);
  try {
    const about = await getAbout();
    const data =
      typeof about === "object" && about !== null && "data" in about
        ? (about as { data?: unknown }).data
        : undefined;
    const version =
      typeof data === "object" && data !== null && "version" in data
        ? (data as { version?: unknown }).version
        : undefined;

    if (version === SUPPORTED_BACKEND_VERSION) {
      return {
        status: "verified",
        sessionIdentity,
        backendApiBase: normalizedBase,
        backendVersion: SUPPORTED_BACKEND_VERSION,
        checkedAt: now,
      };
    }

    return {
      status: "blocked",
      reason: typeof version === "string" ? "mismatch" : "unverifiable",
      sessionIdentity,
      backendApiBase: normalizedBase,
      backendVersion: typeof version === "string" ? version : undefined,
      checkedAt: now,
    };
  } catch {
    return {
      status: "blocked",
      reason: "unverifiable",
      sessionIdentity,
      backendApiBase: normalizedBase,
      checkedAt: now,
    };
  }
}

export function assertFinancialCompatibility(
  state: CompatibilityState | undefined,
  sessionIdentity: string,
  backendApiBase: string | URL,
  now = Date.now(),
): asserts state is Extract<CompatibilityState, { status: "verified" }> {
  if (!isCompatibilityCurrent(state, sessionIdentity, backendApiBase, now)) {
    throw new Error(
      `Financial access is blocked until this session verifies Firefly III ${SUPPORTED_BACKEND_VERSION}. Reconnect to check compatibility.`,
    );
  }
}
