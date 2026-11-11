import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import {
  listPreferences,
  preferenceValue,
} from "@/features/preferences/service";
import {
  PreferenceForm,
  type PreferenceDefaults,
} from "@/features/preferences/preference-form";
import { ErrorState } from "@/components/shell/states";

export const dynamic = "force-dynamic";
function mapAccounts(payload: unknown): { id: string; name: string }[] {
  if (typeof payload !== "object" || payload === null) return [];
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data.flatMap((value) => {
    if (typeof value !== "object" || value === null) return [];
    const resource = value as { id?: unknown; attributes?: unknown };
    const a = (resource.attributes ?? {}) as Record<string, unknown>;
    const id = typeof resource.id === "string" ? resource.id : "";
    const name = typeof a.name === "string" ? a.name : "";
    return id && name ? [{ id, name }] : [];
  });
}
export default async function PreferencesPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Preferences</p>
          <h1>Connect to manage preferences</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Preferences are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let prefs;
  let accounts;
  try {
    const [p, a] = await Promise.all([
      listPreferences(context.client),
      context.client.request("accounts.index", { query: { limit: 100 } }),
    ]);
    prefs = p;
    accounts = mapAccounts(a.data);
  } catch {
    return (
      <ErrorState level={1} title="Preferences could not be loaded">
        <p>Check the connection.</p>
      </ErrorState>
    );
  }
  const frontpage = preferenceValue(prefs, "frontpageAccounts");
  const optional = preferenceValue(
    prefs,
    "transaction_journal_optional_fields",
  );
  const defaults: PreferenceDefaults = {
    locale: String(preferenceValue(prefs, "locale") ?? "equal"),
    listPageSize: String(preferenceValue(prefs, "listPageSize") ?? "20"),
    viewRange: String(preferenceValue(prefs, "viewRange") ?? "1m"),
    convert:
      preferenceValue(prefs, "convert_to_primary") === true ||
      preferenceValue(prefs, "convert_to_primary") === "1",
    customFiscalYear:
      preferenceValue(prefs, "customFiscalYear") === true ||
      preferenceValue(prefs, "customFiscalYear") === "1",
    fiscalYearStart: String(
      preferenceValue(prefs, "fiscalYearStart") ?? "01-01",
    ),
    frontpageAccounts: Array.isArray(frontpage) ? frontpage.map(String) : [],
    optionalFields:
      typeof optional === "object" && optional !== null
        ? Object.fromEntries(
            Object.entries(optional as Record<string, unknown>).map(
              ([key, value]) => [key, value === true],
            ),
          )
        : {},
  };
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Preferences</p>
        <h1>Preferences, locale and defaults</h1>
        <p className="lede">
          Backend preferences use verified keys. English UI is fixed; formatting
          locale and dashboard defaults are configurable without creating
          translation or RTL UI.
        </p>
      </section>
      <section className="panel">
        <h2>Supported preferences</h2>
        <PreferenceForm defaults={defaults} accounts={accounts} />
        <p className="muted-note">
          Unavailable session-side effects (live locale refresh, conversion
          recalculation event) remain residual. Secrets are not written as plain
          preferences.
        </p>
      </section>
    </div>
  );
}
