import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { getTag, tagTransactions } from "@/features/classification/service";
import { DeleteTag, TagForm } from "@/features/classification/class-forms";
import { ErrorState } from "@/components/shell/states";
import { MoneyDisplay } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  if (!tag) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <ErrorState level={1} title="Connect to view this tag">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  let record;
  let transactions;
  try {
    [record, transactions] = await Promise.all([
      getTag(context.client, tag),
      tagTransactions(context.client, tag),
    ]);
  } catch {
    return (
      <ErrorState level={1} title="Tag could not be loaded">
        <Link className="text-link" href="/tags">
          Return to tags
        </Link>
      </ErrorState>
    );
  }
  if (!record) notFound();
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Tag {record.id}</p>
        <h1>{record.tag}</h1>
        <div className="button-row">
          <DeleteTag tag={record} />
          <Link className="text-link" href="/tags">
            Back to tags
          </Link>
        </div>
      </section>
      <section className="panel">
        <h2>Tagged transactions</h2>
        {transactions.groups.length === 0 ? (
          <p className="muted-note">No transactions reported.</p>
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
        <h2>Edit tag</h2>
        <TagForm tag={record} />
      </section>
    </div>
  );
}
