import Link from "next/link";
import { getCurrentAuth } from "@/lib/auth/service";
import { getServerEnvironment } from "@/lib/server-env";

export const dynamic = "force-dynamic";

function backendPublicUrlOrNull(): string | null {
  try {
    return getServerEnvironment()
      .backendPublicUrl.toString()
      .replace(/\/$/, "");
  } catch {
    return null;
  }
}

const LINKS = [
  [
    "Login and logout",
    "/login",
    "Native login/logout and remote-auth redirects.",
  ],
  [
    "Registration",
    "/register",
    "Registration and invitation acceptance are backend-owned.",
  ],
  [
    "Password reset",
    "/password/reset",
    "Request and complete password reset emails natively.",
  ],
  [
    "Profile and email",
    "/profile",
    "Change email, confirm/undo and profile security natively.",
  ],
  [
    "Change password",
    "/profile/change-password",
    "Change password and invalidate other sessions natively.",
  ],
  [
    "Multi-factor authentication",
    "/mfa/index",
    "Enroll, verify, disable MFA and manage backup codes natively.",
  ],
  [
    "Personal access tokens",
    "/profile/oauth",
    "List, create and revoke PATs and manage OAuth clients/secrets.",
  ],
  [
    "Delete account",
    "/profile",
    "Account deletion remains a native backend confirmation flow.",
  ],
] as const;

export default async function SecurityPage() {
  const auth = await getCurrentAuth();
  const backend = backendPublicUrlOrNull();
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Security and identity</p>
        <h1>Trusted native identity handoffs</h1>
        <p className="lede">
          Firefly owns identity validation, MFA, recovery, profile security and
          token/client lifecycle. These links open the native backend in a
          separate session; no token or secret is placed in a URL.
        </p>
        <p>
          {auth.session
            ? `Frontend session connected as ${auth.session.user.email}.`
            : "No frontend account is connected."}
        </p>
      </section>
      <section className="panel">
        <h2>Native account and security links</h2>
        {backend ? (
          <ul className="link-list">
            {LINKS.map(([label, path, description]) => (
              <li key={path}>
                <a
                  className="text-link"
                  href={`${backend}${path}`}
                  rel="noreferrer"
                >
                  {label}
                </a>
                <p className="muted-note">{description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted-note">
            Set BACKEND_PUBLIC_URL to enable trusted native links.
          </p>
        )}
        <p className="muted-note">
          The frontend does not proxy, store or replay backend
          sessions/passwords. Identity errors and permission checks stay on the
          backend.
        </p>
        <Link className="text-link" href="/settings">
          Back to settings
        </Link>
      </section>
    </div>
  );
}
