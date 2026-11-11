import Link from "next/link";
import { getCurrentAuth } from "@/lib/auth/service";
import { getServerEnvironment } from "@/lib/server-env";
import { Status } from "@/components/ui/primitives";

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

export default async function SettingsPage() {
  const auth = await getCurrentAuth();
  const backendPublicUrl = backendPublicUrlOrNull();
  const user = auth.session?.user ?? null;

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Settings</p>
        <h1>Connection and appearance</h1>
        <p>
          Appearance is stored in this browser only. Session and financial data
          are never written to browser storage.
        </p>
        <p>
          {user ? (
            <Status kind="success">Connected as {user.email}</Status>
          ) : (
            <Status kind="warning">Not connected</Status>
          )}
        </p>
        <p className="muted-note">
          Use the Appearance button in the header to change theme, glass frost,
          reduced transparency and amount privacy. The date range selector keeps
          its value in the page URL.
        </p>
        <Link className="text-link" href="/">
          Return to overview
        </Link>
      </section>

      <section className="panel">
        <h2>Native backend account</h2>
        <p>
          Login, registration, password reset, multi-factor authentication,
          profile security and token or OAuth-client management remain in the
          native Firefly interface. They use a separate backend session, not
          this frontend session.
        </p>
        {backendPublicUrl ? (
          <ul className="link-list">
            <li>
              <a href={`${backendPublicUrl}/profile`} rel="noreferrer">
                Profile and email
              </a>
            </li>
            <li>
              <a
                href={`${backendPublicUrl}/profile/change-password`}
                rel="noreferrer"
              >
                Change password
              </a>
            </li>
            <li>
              <a href={`${backendPublicUrl}/mfa/index`} rel="noreferrer">
                Multi-factor authentication
              </a>
            </li>
            <li>
              <a href={`${backendPublicUrl}/profile/oauth`} rel="noreferrer">
                Personal access tokens and OAuth clients
              </a>
            </li>
          </ul>
        ) : (
          <p className="muted-note">
            Native identity links are unavailable until BACKEND_PUBLIC_URL is
            configured.
          </p>
        )}
      </section>

      <section className="panel">
        <h2>Disconnecting</h2>
        <p>
          Disconnecting removes this frontend session and its encrypted cookie.
          It does not log you out of the native Firefly backend and does not
          revoke a personal access token. Revoke tokens in the native profile.
        </p>
      </section>
    </div>
  );
}
