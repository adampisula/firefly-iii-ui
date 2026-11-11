import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import {
  getRecurrence,
  recurrenceTransactions,
} from "@/features/recurrences/service";
import {
  DeleteRecurrence,
  RecurrenceForm,
  TriggerRecurrenceForm,
} from "@/features/recurrences/recurrence-forms";
import { ErrorState } from "@/components/shell/states";
import { MoneyDisplay } from "@/components/ui/primitives";

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
export default async function RecurrenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <ErrorState level={1} title="Connect to view this recurrence">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  let recurrence;
  let transactions;
  let accounts: { id: string; name: string; type: string }[] = [];
  let currencies: { code: string; name: string }[] = [];
  try {
    const [r, t, a, c] = await Promise.all([
      getRecurrence(context.client, id),
      recurrenceTransactions(context.client, id),
      context.client.request("accounts.index", { query: { limit: 100 } }),
      context.client.request("currencies.index", { query: { limit: 100 } }),
    ]);
    recurrence = r;
    transactions = t;
    accounts = mapAccounts(a.data);
    currencies = mapCurrencies(c.data);
  } catch {
    return (
      <ErrorState level={1} title="Recurrence could not be loaded">
        <Link className="text-link" href="/recurrences">
          Return to recurrences
        </Link>
      </ErrorState>
    );
  }
  if (!recurrence) notFound();
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Recurrence {recurrence.id}</p>
        <h1>{recurrence.title}</h1>
        <p>
          {recurrence.type} · first {recurrence.firstDate.slice(0, 10)} · latest{" "}
          {recurrence.latestDate?.slice(0, 10) ?? "never"} ·{" "}
          {recurrence.active ? "active" : "inactive"}
        </p>
        <div className="button-row">
          <DeleteRecurrence id={recurrence.id} title={recurrence.title} />
          <Link className="text-link" href="/recurrences">
            Back to recurrences
          </Link>
        </div>
      </section>
      <section className="panel">
        <h2>Generated transactions</h2>
        {transactions.groups.length === 0 ? (
          <p className="muted-note">No generated transactions reported.</p>
        ) : (
          <ul className="journal-list">
            {transactions.groups.map((group) => (
              <li key={group.id}>
                <Link className="text-link" href={`/transactions/${group.id}`}>
                  {group.title}
                </Link>
                {group.journals.map((journal) => (
                  <span key={journal.journalId} className="muted-note">
                    {" "}
                    ·{" "}
                    <MoneyDisplay
                      amount={journal.amount}
                      currency={journal.currencyCode}
                      decimalPlaces={journal.decimalPlaces}
                    />
                  </span>
                ))}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="panel">
        <h2>Trigger recurrence</h2>
        <TriggerRecurrenceForm id={recurrence.id} />
      </section>
      <section className="panel">
        <h2>Edit recurrence</h2>
        <RecurrenceForm
          recurrence={recurrence}
          accounts={accounts}
          currencies={currencies}
        />
      </section>
    </div>
  );
}
