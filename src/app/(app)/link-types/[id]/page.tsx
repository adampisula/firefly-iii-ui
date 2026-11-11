import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { getLinkTypeTransactions } from "@/features/transaction-actions/service";
import { LinkTypeForm } from "@/features/transaction-actions/link-type-form";
import { DeleteLinkTypeDialog } from "@/features/transaction-actions/delete-link-type-dialog";
import { ErrorState } from "@/components/shell/states";
import { MoneyDisplay } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function LinkTypeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <ErrorState level={1} title="Connect to view this link type">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState level={1} title="Link types are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  }

  let data;
  try {
    data = await getLinkTypeTransactions(context.client, id);
  } catch {
    return (
      <ErrorState level={1} title="Link type could not be loaded">
        <Link className="text-link" href="/link-types">
          Return to link types
        </Link>
      </ErrorState>
    );
  }
  if (!data) notFound();

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Link type {data.linkType.id}</p>
        <h1>{data.linkType.name}</h1>
        <p>
          Inward: <strong>{data.linkType.inward}</strong> · Outward:{" "}
          <strong>{data.linkType.outward}</strong>
        </p>
        <div className="button-row">
          <DeleteLinkTypeDialog
            id={data.linkType.id}
            name={data.linkType.name}
          />
          <Link className="text-link" href="/link-types">
            Back to link types
          </Link>
        </div>
      </section>

      <section className="panel">
        <h2>Related transactions</h2>
        {data.transactions.groups.length === 0 ? (
          <p className="muted-note">No transactions use this link type.</p>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Linked transactions"
          >
            <table className="data-table">
              <caption>Transactions using this link type</caption>
              <thead>
                <tr>
                  <th scope="col">Group</th>
                  <th scope="col">Journal</th>
                  <th scope="col">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.groups.map((group) =>
                  group.journals.map((journal) => (
                    <tr key={`${group.id}-${journal.journalId}`}>
                      <td>
                        <Link
                          className="text-link"
                          href={`/transactions/${group.id}`}
                        >
                          {group.title}
                        </Link>
                      </td>
                      <td>{journal.journalId}</td>
                      <td>
                        <MoneyDisplay
                          amount={journal.amount}
                          currency={journal.currencyCode}
                          decimalPlaces={journal.decimalPlaces}
                        />
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Edit link type</h2>
        <LinkTypeForm linkType={data.linkType} />
      </section>
    </div>
  );
}
