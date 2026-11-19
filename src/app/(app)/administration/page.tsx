import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { listAdministrations } from "@/features/administrations/service";
import { AdministrationForm } from "@/features/administrations/admin-form";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";
function mapCurrencies(payload: unknown): { code: string; name: string }[] {
  if (typeof payload !== "object" || payload === null) return [];
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data.flatMap((value) => {
    if (typeof value !== "object" || value === null) return [];
    const a = (value as { attributes?: unknown }).attributes;
    if (typeof a !== "object" || a === null) return [];
    const r = a as Record<string, unknown>;
    const code = typeof r.code === "string" ? r.code : "";
    const name = typeof r.name === "string" ? r.name : "";
    return code && name ? [{ code, name }] : [];
  });
}
export default async function AdministrationPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Administration</p>
          <h1>Connect to view administration settings</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Administration is blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let groups;
  let currencies;
  try {
    const [g, c] = await Promise.all([
      listAdministrations(context.client),
      context.client.request("currencies.index", { query: { limit: 100 } }),
    ]);
    groups = g;
    currencies = mapCurrencies(c.data);
  } catch {
    return (
      <ErrorState level={1} title="Administration could not be loaded">
        <p>Check the connection.</p>
      </ErrorState>
    );
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Administration"
        title="Existing administration settings"
        lede="Title and primary currency for the administration group. No create/delete/switch/sharing screens are offered."
      />
      {groups.length === 0 ? (
        <PermissionState title="No administration visible">
          <p>The backend did not return a user group.</p>
        </PermissionState>
      ) : (
        groups.map((group) => (
          <section className="panel" key={group.id}>
            <h2>
              {group.title} <span className="muted-note">ID {group.id}</span>
            </h2>
            <p>
              Primary currency: {group.primaryCurrencyCode}
              {group.canSeeMembers
                ? ` · ${group.members.length} visible member(s)`
                : " · membership hidden"}
            </p>
            <AdministrationForm
              id={group.id}
              title={group.title}
              currency={group.primaryCurrencyCode}
              currencies={currencies}
            />
            <p className="muted-note">
              If the current role cannot edit, Firefly rejects the write.
            </p>
          </section>
        ))
      )}
    </div>
  );
}
