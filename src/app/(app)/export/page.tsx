import Link from "next/link";
import { getServerEnvironment } from "@/lib/server-env";
import { getCurrentAuth } from "@/lib/auth/service";

export const dynamic = "force-dynamic";
const EXPORTS = [
  ["accounts", "Accounts"],
  ["transactions", "Transactions"],
  ["bills", "Bills"],
  ["subscriptions", "Subscriptions"],
  ["budgets", "Budgets"],
  ["categories", "Categories"],
  ["piggy-banks", "Piggy banks"],
  ["recurring", "Recurring templates"],
  ["rules", "Rules"],
  ["tags", "Tags"],
] as const;

function backendPublicUrlOrNull(): string | null {
  try {
    return getServerEnvironment()
      .backendPublicUrl.toString()
      .replace(/\/$/, "");
  } catch {
    return null;
  }
}

export default async function ExportPage() {
  const auth = await getCurrentAuth();
  const backend = backendPublicUrlOrNull();
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Exports</p>
        <h1>CSV exports and Data Importer</h1>
        <p className="lede">
          Download supported CSV families directly from Firefly. Authentication
          stays server-side.
        </p>
        {!auth.session ? (
          <p className="muted-note">
            Connect a Firefly account to download exports.
          </p>
        ) : null}
      </section>
      <section className="panel">
        <h2>CSV downloads</h2>
        <ul className="link-list">
          {EXPORTS.map(([resource, label]) => (
            <li key={resource}>
              {auth.session ? (
                <a className="text-link" href={`/api/export/${resource}`}>
                  Download {label} CSV
                </a>
              ) : (
                <span>{label} CSV requires a connection</span>
              )}
            </li>
          ))}
        </ul>
        <p className="muted-note">
          Downloads use the official export endpoints and do not pass through
          browser storage.
        </p>
      </section>
      <section className="panel">
        <h2>Data Importer</h2>
        {backend ? (
          <a className="text-link" href={`${backend}/import`} rel="noreferrer">
            Open the separate Firefly Data Importer
          </a>
        ) : (
          <p className="muted-note">
            Set BACKEND_PUBLIC_URL to open the Data Importer.
          </p>
        )}
        <p className="muted-note">
          The importer is a separate tool with its own setup and credentials.
          This frontend does not embed or proxy it.
        </p>
      </section>
      <section className="panel">
        <h2>Backup and restore boundary</h2>
        <p>
          Database backup/restore is an operator/container workflow, not an
          API-mediated frontend feature. No database access, file scraping or
          destructive restore is performed here.
        </p>
        <Link className="text-link" href="/settings">
          Back to settings
        </Link>
      </section>
    </div>
  );
}
