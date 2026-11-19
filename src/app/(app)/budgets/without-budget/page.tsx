import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { transactionsWithoutBudget } from "@/features/budgets/service";
import { ErrorState } from "@/components/shell/states";
import { MoneyDisplay, PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function WithoutBudgetPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <ErrorState level={1} title="Connect to view unbudgeted transactions">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState level={1} title="Budgets are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  }
  let transactions;
  try {
    transactions = await transactionsWithoutBudget(context.client);
  } catch {
    return (
      <ErrorState level={1} title="Unbudgeted transactions could not be loaded">
        <Link className="text-link" href="/budgets">
          Return to budgets
        </Link>
      </ErrorState>
    );
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Without budget"
        title="Transactions without a budget"
        lede="Backend-authoritative unbudgeted spending. Assigned budget edits remain in the transaction editor."
        actions={
          <Link className="text-link" href="/budgets">
            Back to budgets
          </Link>
        }
      />
      <section className="panel">
        {transactions.groups.length === 0 ? (
          <p className="muted-note">No unbudgeted transactions reported.</p>
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
        <p className="pager">
          Page {transactions.page} of {transactions.pageCount}
        </p>
      </section>
    </div>
  );
}
