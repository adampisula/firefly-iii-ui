import { cookies } from "next/headers";
import { getServerEnvironment } from "../server-env.ts";
import {
  decryptSession,
  encryptSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  type UserSessionData,
} from "./session.ts";
import {
  verifyBackendCompatibility,
  type CompatibilityState,
} from "../api/compatibility.ts";
import { randomUUID } from "node:crypto";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string | null;
  blocked: boolean;
}

export interface AuthContext {
  session: UserSessionData | null;
  accessToken: string | null;
  compatibilityState: CompatibilityState | undefined;
}

export async function getCurrentAuth(): Promise<AuthContext> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return { session: null, accessToken: null, compatibilityState: undefined };
  }

  const session = decryptSession(sessionCookie);
  if (!session) {
    return { session: null, accessToken: null, compatibilityState: undefined };
  }

  const accessToken =
    session.authType === "pat"
      ? (session.patToken ?? null)
      : (session.oauthTokens?.accessToken ?? null);

  return { session, accessToken, compatibilityState: undefined };
}

export async function verifyAndCreatePatSession(
  patToken: string,
): Promise<
  | { success: true; session: UserSessionData }
  | { success: false; error: string }
> {
  const env = getServerEnvironment();
  const backendApiBase = env.backendInternalApiUrl.toString();

  // 1. Verify backend version compatibility
  const compat = await verifyBackendCompatibility(
    async () => {
      const res = await fetch(new URL(`${backendApiBase}/about`), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${patToken}`,
        },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    "probe",
    backendApiBase,
  );

  if (compat.status !== "verified") {
    return {
      success: false,
      error:
        compat.reason === "mismatch"
          ? `Backend version mismatch (detected ${compat.backendVersion ?? "unknown"}). Only Firefly III 6.7.9 is supported.`
          : `Could not verify backend compatibility (${compat.reason}). Ensure the Firefly III server is reachable.`,
    };
  }

  // 2. Verify PAT token by fetching current user
  try {
    const userRes = await fetch(new URL(`${backendApiBase}/about/user`), {
      headers: {
        Authorization: `Bearer ${patToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!userRes.ok) {
      if (userRes.status === 401) {
        return { success: false, error: "Invalid Personal Access Token." };
      }
      return {
        success: false,
        error: `Authentication failed (HTTP ${userRes.status}).`,
      };
    }

    const userData = (await userRes.json()) as {
      data: {
        id: string;
        attributes: {
          email: string;
          blocked: boolean;
          role: string | null;
        };
      };
    };

    if (userData.data.attributes.blocked) {
      return { success: false, error: "This user account is blocked." };
    }

    const session: UserSessionData = {
      identity: randomUUID(),
      user: {
        id: userData.data.id,
        email: userData.data.attributes.email,
        role: userData.data.attributes.role,
        blocked: userData.data.attributes.blocked,
      },
      authType: "pat",
      patToken,
      createdAt: Date.now(),
    };

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, encryptSession(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });

    return { success: true, session };
  } catch (err) {
    return {
      success: false,
      error: `Could not connect to backend: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
