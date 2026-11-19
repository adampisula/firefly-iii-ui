import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { listRecurrences } from "@/features/recurrences/service";
import { RecurrenceForm } from "@/features/recurrences/recurrence-forms";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { PageHeader } from "@/components/ui/primitives";

import { formatDisplayDate } from "@/lib/finance/dates";
export const dynamic = "force-dynamic";
function mapAccounts(
  payload: unknown,
): { id: string; name: string; type: string }[] {
  if (typeof payload !== "object" || payload === null) return [];
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data.flatMap((value) => {
    if (typeof value !== "object" || value === null) return [];
    const resource = value as { id?: unknown; attributes?: unknown };
    const a = (resource.attributes ?? {}) as Record<string, unknown>;
    const id = typeof resource.id === "string" ? resource.id : "";
    const name = typeof a.name === "string" ? a.name : "";
    const type = typeof a.type === "string" ? a.type : "";
    return id && name ? [{ id, name, type }] : [];
  });
}
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
export default async function RecurrencesPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Recurrences</p>
          <h1>Connect to manage recurrences</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Recurrences are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let recurrences;
  let accounts: { id: string; name: string; type: string }[] = [];
  let currencies: { code: string; name: string }[] = [];
  try {
    const [r, a, c] = await Promise.all([
      listRecurrences(context.client),
      context.client.request("accounts.index", { query: { limit: 100 } }),
      context.client.request("currencies.index", { query: { limit: 100 } }),
    ]);
    recurrences = r;
    accounts = mapAccounts(a.data);
    currencies = mapCurrencies(c.data);
  } catch {
    return (
      <ErrorState level={1} title="Recurrences could not be loaded">
        <p>Check the connection.</p>
      </ErrorState>
    );
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Recurrences"
        title="Recurring transactions"
        lede="Templates, latest generated date and execution. Schedule suggestions/calendar remain residual."
      />
      <section className="panel">
        <h2>Recurrences</h2>
        {recurrences.length === 0 ? (
          <PermissionState title="No recurrences">
            <p>Create one below.</p>
          </PermissionState>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Recurrences"
          >
            <table className="data-table">
              <caption>Recurrences</caption>
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Type</th>
                  <th scope="col">First date</th>
                  <th scope="col">Latest</th>
                  <th scope="col">Frequency</th>
                </tr>
              </thead>
              <tbody>
                {recurrences.map((recurrence) => (
                  <tr key={recurrence.id}>
                    <td>
                      <Link
                        className="text-link"
                        href={`/recurrences/${recurrence.id}`}
                      >
                        {recurrence.title}
                      </Link>
                    </td>
                    <td>{recurrence.type}</td>
                    <td>{formatDisplayDate(recurrence.firstDate)}</td>
                    <td>
                      {recurrence.latestDate
                        ? formatDisplayDate(recurrence.latestDate)
                        : "Never"}
                    </td>
                    <td>{recurrence.repetitions[0]?.type ?? "None"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="panel">
        <h2>Create recurrence</h2>
        <RecurrenceForm accounts={accounts} currencies={currencies} />
      </section>
    </div>
  );
}
