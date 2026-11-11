import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { getBill, getBillRelated } from "@/features/subscriptions/service";
import {
  BillForm,
  DeleteBillDialog,
} from "@/features/subscriptions/bill-forms";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { MoneyDisplay, Status } from "@/components/ui/primitives";

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

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <ErrorState level={1} title="Connect to view this subscription">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState level={1} title="Subscriptions are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  }
  let bill;
  let related;
  let currencies: { code: string; name: string }[] = [];
  try {
    [bill, related, currencies] = await Promise.all([
      getBill(context.client, id),
      getBillRelated(context.client, id),
      context.client
        .request("currencies.index", { query: { limit: 100 } })
        .then((response) =>
          mapCurrencies(response.data).sort((a, b) =>
            a.code.localeCompare(b.code),
          ),
        ),
    ]);
  } catch {
    return (
      <ErrorState level={1} title="Subscription could not be loaded">
        <Link className="text-link" href="/subscriptions">
          Return to subscriptions
        </Link>
      </ErrorState>
    );
  }
  if (!bill) notFound();

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Subscription {bill.id}</p>
        <h1>{bill.name}</h1>
        <p className="result-meta">
          <Status kind={bill.active ? "success" : "neutral"}>
            {bill.active ? "Active" : "Inactive"}
          </Status>
          <Status kind="neutral">
            {bill.repeatFreq} / skip {bill.skip}
          </Status>
          <Status kind="neutral">{bill.objectGroupTitle ?? "Ungrouped"}</Status>
        </p>
        <p>
          Amount range:{" "}
          <MoneyDisplay
            amount={bill.amountMin}
            currency={bill.currencyCode}
            decimalPlaces={bill.decimalPlaces}
          />{" "}
          –{" "}
          <MoneyDisplay
            amount={bill.amountMax}
            currency={bill.currencyCode}
            decimalPlaces={bill.decimalPlaces}
          />{" "}
          · average{" "}
          <MoneyDisplay
            amount={bill.amountAvg}
            currency={bill.currencyCode}
            decimalPlaces={bill.decimalPlaces}
          />
        </p>
        <p>
          Next expected:{" "}
          {bill.nextExpectedMatch
            ? bill.nextExpectedMatch.slice(0, 10)
            : "Not scheduled"}
          {bill.nextExpectedMatchDiff ? ` (${bill.nextExpectedMatchDiff})` : ""}
        </p>
        <div className="button-row">
          <DeleteBillDialog id={bill.id} name={bill.name} />
          <Link className="text-link" href="/subscriptions">
            Back to subscriptions
          </Link>
        </div>
      </section>

      <section className="panel">
        <h2>Expected payments timeline</h2>
        {bill.payDates.length === 0 ? (
          <p className="muted-note">No pay dates reported.</p>
        ) : (
          <ul className="journal-list">
            {bill.payDates.map((date) => (
              <li key={date}>{date.slice(0, 10)}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2>Matched transactions</h2>
        {related.transactions.groups.length === 0 ? (
          <p className="muted-note">No matched transactions reported.</p>
        ) : (
          <ul className="journal-list">
            {related.transactions.groups.map((group) => (
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
        <h2>Matching rules</h2>
        {related.rules.length === 0 ? (
          <p className="muted-note">No matching rules reported.</p>
        ) : (
          <ul className="link-list">
            {related.rules.map((rule) => (
              <li key={rule.id}>
                {rule.title} · {rule.active ? "active" : "inactive"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2>Attachments</h2>
        {related.attachments.length === 0 ? (
          <p className="muted-note">No attachments reported.</p>
        ) : (
          <ul className="link-list">
            {related.attachments.map((attachment) => (
              <li key={attachment.id}>
                {attachment.title} · {attachment.filename} · {attachment.size}{" "}
                bytes
              </li>
            ))}
          </ul>
        )}
        <p className="muted-note">Download and preview arrive with CORE-11.</p>
      </section>

      <section className="panel">
        <PermissionState title="Rescan unavailable">
          <p>
            Firefly 6.7.9 has no supported rescan API or proven composition.
            Rescanning remains a GAP-06 residual and is not simulated. Matching
            rules and transaction edits remain available in their owned screens.
          </p>
        </PermissionState>
      </section>

      <section className="panel">
        <h2>Edit subscription</h2>
        <BillForm bill={bill} currencies={currencies} />
      </section>
    </div>
  );
}
