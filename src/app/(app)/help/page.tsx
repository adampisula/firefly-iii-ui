import packageMetadata from "../../../../package.json" with { type: "json" };
import { getSessionApiContext } from "@/lib/auth/api-context";
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

export default async function HelpPage() {
  const context = await getSessionApiContext().catch(() => null);
  const backendPublicUrl = backendPublicUrlOrNull();

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Help and system</p>
        <h1>Firefly frontend</h1>
        <dl className="detail-list">
          <div>
            <dt>Frontend version</dt>
            <dd>{packageMetadata.version}</dd>
          </div>
          <div>
            <dt>Required backend</dt>
            <dd>Firefly III 6.7.9 (exact version)</dd>
          </div>
          <div>
            <dt>Connection</dt>
            <dd>
              {context ? (
                <Status
                  kind={
                    context.compatibility.status === "verified"
                      ? "success"
                      : "warning"
                  }
                >
                  {context.compatibility.status === "verified"
                    ? "Verified"
                    : "Compatibility blocked"}
                </Status>
              ) : (
                <Status kind="warning">Not connected</Status>
              )}
            </dd>
          </div>
        </dl>
        <p className="muted-note">
          Internal upstream URLs, tokens and credentials are intentionally not
          shown in diagnostics.
        </p>
      </section>

      <section className="panel">
        <h2>Native Firefly help</h2>
        <p>
          Backend administration, user support, release notes and native
          settings live in the Firefly backend interface.
        </p>
        {backendPublicUrl ? (
          <ul className="link-list">
            <li>
              <a href={backendPublicUrl} rel="noreferrer">
                Open the native Firefly interface
              </a>
            </li>
            <li>
              <a href={`${backendPublicUrl}/profile/oauth`} rel="noreferrer">
                Manage personal access tokens
              </a>
            </li>
          </ul>
        ) : (
          <p className="muted-note">Native links require BACKEND_PUBLIC_URL.</p>
        )}
      </section>
    </div>
  );
}
