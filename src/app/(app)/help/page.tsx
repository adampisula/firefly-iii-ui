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
  let releaseNotes: string | null = null;
  let releaseVersion: string | null = null;
  let configCount: number | null = null;
  if (context && context.compatibility.status === "verified") {
    const [release, configuration] = await Promise.all([
      context.client.request("release-notes.index").catch(() => null),
      context.client.request("configuration.index").catch(() => null),
    ]);
    if (release?.data && typeof release.data === "object") {
      const root = release.data as {
        data?: { attributes?: { version?: string; notes?: string } };
      };
      releaseVersion = root.data?.attributes?.version ?? null;
      releaseNotes = root.data?.attributes?.notes ?? null;
    }
    if (configuration?.data && typeof configuration.data === "object") {
      const root = configuration.data as { data?: unknown[] };
      configCount = Array.isArray(root.data) ? root.data.length : null;
    }
  }

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
        <h2>Release notes and configuration</h2>
        {releaseVersion ? (
          <p>
            Latest release metadata: <strong>{releaseVersion}</strong>
          </p>
        ) : (
          <p className="muted-note">
            Release notes are unavailable for this session.
          </p>
        )}
        {releaseNotes ? <p className="pre-wrap">{releaseNotes}</p> : null}
        <p className="muted-note">
          Configuration keys returned: {configCount ?? "not available"}. Values
          are not dumped because they may contain secrets.
        </p>
      </section>

      <section className="panel">
        <h2>Automatic processing and cron</h2>
        <p>
          Recurrences, rules of type store/update and scheduled processing are
          executed by the backend cron job. The frontend does not run cron and
          does not store the CLI token. Generate or regenerate the personal cron
          token in the native profile.
        </p>
        {backendPublicUrl ? (
          <a
            className="text-link"
            href={`${backendPublicUrl}/profile`}
            rel="noreferrer"
          >
            Open native profile for the cron token
          </a>
        ) : null}
      </section>

      <section className="panel">
        <h2>Installer, recovery and support</h2>
        <p>
          Database initialization/upgrade, key generation, debug pages, route
          inspection and browser-state recovery are operator/native workflows.
          They are not API-mediated and are not rebuilt here. Use the official
          image documentation and native interface for those operations.
        </p>
        <p className="muted-note">
          No arbitrary command runner, database access, backend patch or
          scraping is used by this frontend.
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
