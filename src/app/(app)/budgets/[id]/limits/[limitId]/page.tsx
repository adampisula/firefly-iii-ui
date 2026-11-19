import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import {
  limitTransactions,
  listBudgetLimits,
} from "@/features/budgets/service";
import { ErrorState } from "@/components/shell/states";
import { MoneyDisplay } from "@/components/ui/primitives";

import { formatDisplayDate } from "@/lib/finance/dates";
export const dynamic = "force-dynamic";

export default async function BudgetLimitPage({
  params,
}: {
  params: Promise<{ id: string; limitId: string }>;
}) {
  const { id, limitId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(limitId)) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <ErrorState level={1} title="Connect to view this limit">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState level={1} title="Budget limits are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  }

  let limit;
  let transactions;
  try {
    const [limits, transactionData] = await Promise.all([
      listBudgetLimits(context.client, id),
      limitTransactions(context.client, id, limitId),
    ]);
    limit = limits.find((item) => item.id === limitId);
    transactions = transactionData;
  } catch {
    return (
      <ErrorState level={1} title="Limit could not be loaded">
        <Link className="text-link" href={`/budgets/${id}`}>
          Return to the budget
        </Link>
      </ErrorState>
    );
  }
  if (!limit) notFound();

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Budget limit {limit.id}</p>
        <h1>
          <MoneyDisplay
            amount={limit.amount}
            currency={limit.currencyCode}
            decimalPlaces={limit.decimalPlaces}
          />
        </h1>
        <p>
          {formatDisplayDate(limit.start)} to {formatDisplayDate(limit.end)} ·
          budget {id}
        </p>
        <Link className="text-link" href={`/budgets/${id}`}>
          Back to the budget
        </Link>
      </section>

      <section className="panel">
        <h2>Transactions in this limit</h2>
        {transactions.groups.length === 0 ? (
          <p className="muted-note">No transactions reported for this limit.</p>
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
                    · {journal.description} ·{" "}
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
    </div>
  );
}
