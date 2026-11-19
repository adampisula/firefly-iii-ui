import Link from "next/link";
import { getCurrentAuth } from "@/lib/auth/service";
import { getServerEnvironment } from "@/lib/server-env";
import { PageHeader, Status } from "@/components/ui/primitives";
import { SettingsAppearance } from "@/components/appearance/settings-appearance";

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
      <PageHeader
        eyebrow="Settings"
        title="Connection and appearance"
        lede="Appearance settings and the background image sync to this user profile through the frontend server. Financial data and tokens are never written to browser storage."
        actions={
          <Link className="text-link" href="/">
            Return to overview
          </Link>
        }
      />
      <section className="panel">
        <p>
          {user ? (
            <Status kind="success">Connected as {user.email}</Status>
          ) : (
            <Status kind="warning">Not connected</Status>
          )}
        </p>
        <p className="muted-note">
          The date range selector keeps its value in the page URL. Use the
          privacy control in the header to hide amounts everywhere.
        </p>
      </section>

      <section className="panel" id="appearance">
        <h2>Appearance</h2>
        <p className="lede">
          Choose a theme, accent and background. Accent colors are checked for
          readable contrast; the custom background is compressed here before it
          is saved to your profile.
        </p>
        <SettingsAppearance />
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
