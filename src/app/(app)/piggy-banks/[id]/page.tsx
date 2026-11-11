import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { getPiggyBank, getPiggyEvents } from "@/features/piggy-banks/service";
import {
  DeletePiggyDialog,
  PiggyForm,
} from "@/features/piggy-banks/piggy-forms";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { MoneyDisplay } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

function mapCurrencies(payload: unknown): { code: string; name: string }[] {
  if (typeof payload !== "object" || payload === null) return [];
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data.flatMap((value) => {
    if (typeof value !== "object" || value === null) return [];
    const attributes = (value as { attributes?: unknown }).attributes;
    if (typeof attributes !== "object" || attributes === null) return [];
    const record = attributes as Record<string, unknown>;
    const code = typeof record.code === "string" ? record.code : "";
    const name = typeof record.name === "string" ? record.name : "";
    return code && name ? [{ code, name }] : [];
  });
}

function mapAccounts(
  payload: unknown,
): { id: string; name: string; type: string }[] {
  if (typeof payload !== "object" || payload === null) return [];
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data.flatMap((value) => {
    if (typeof value !== "object" || value === null) return [];
    const resource = value as { id?: unknown; attributes?: unknown };
    const attributes = (resource.attributes ?? {}) as Record<string, unknown>;
    const id = typeof resource.id === "string" ? resource.id : "";
    const name = typeof attributes.name === "string" ? attributes.name : "";
    const type = typeof attributes.type === "string" ? attributes.type : "";
    return id && name && (type === "asset" || type === "liability")
      ? [{ id, name, type }]
      : [];
  });
}

export default async function PiggyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <ErrorState level={1} title="Connect to view this savings goal">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Savings goals are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let piggy;
  let events;
  let accounts: { id: string; name: string; type: string }[] = [];
  let currencies: { code: string; name: string }[] = [];
  try {
    let currencyData;
    [piggy, events, accounts, currencyData] = await Promise.all([
      getPiggyBank(context.client, id),
      getPiggyEvents(context.client, id),
      context.client
        .request("accounts.index", { query: { limit: 100 } })
        .then((response) => mapAccounts(response.data)),
      context.client.request("currencies.index", { query: { limit: 100 } }),
    ]);
    currencies = mapCurrencies(currencyData.data);
  } catch {
    return (
      <ErrorState level={1} title="Savings goal could not be loaded">
        <Link className="text-link" href="/piggy-banks">
          Return to savings goals
        </Link>
      </ErrorState>
    );
  }
  if (!piggy) notFound();
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Savings goal {piggy.id}</p>
        <h1>{piggy.name}</h1>
        <p>
          {piggy.percentage !== null
            ? `${piggy.percentage}% complete`
            : "Progress not reported"}{" "}
          · {piggy.objectGroupTitle ?? "Ungrouped"}
        </p>
        <div className="button-row">
          <DeletePiggyDialog id={piggy.id} name={piggy.name} />
          <Link className="text-link" href="/piggy-banks">
            Back to savings goals
          </Link>
        </div>
      </section>
      <section className="panel">
        <h2>Account allocations</h2>
        <ul className="link-list">
          {piggy.accounts.map((account) => (
            <li key={account.accountId}>
              {account.name} ·{" "}
              <MoneyDisplay
                amount={account.currentAmount}
                currency={account.currencyCode}
                decimalPlaces={account.decimalPlaces}
              />
            </li>
          ))}
        </ul>
        <p className="muted-note">
          Editing below sets the primary allocation. Additional account
          allocations are preserved.
        </p>
      </section>
      <section className="panel">
        <h2>Event history</h2>
        {events.length === 0 ? (
          <p className="muted-note">No events reported.</p>
        ) : (
          <ul className="journal-list">
            {events.map((event) => (
              <li key={event.id}>
                {event.date?.slice(0, 10) ?? "No date"} · amount {event.amount}
                {event.journalId ? ` · journal ${event.journalId}` : ""}
              </li>
            ))}
          </ul>
        )}
        <p className="muted-note">
          History chart rendering is not implemented; event data is read-only.
        </p>
      </section>
      <section className="panel">
        <PermissionState title="Reset history unavailable">
          <p>
            Firefly 6.7.9 exposes no reset-history API. The action remains a
            GAP-06 residual and is not simulated.
          </p>
        </PermissionState>
      </section>
      <section className="panel">
        <h2>Edit savings goal</h2>
        <PiggyForm piggy={piggy} accounts={accounts} currencies={currencies} />
      </section>
    </div>
  );
}
