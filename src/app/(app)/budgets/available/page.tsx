import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { listAvailableBudgets } from "@/features/budgets/service";
import { ErrorState } from "@/components/shell/states";
import { MoneyDisplay, PageHeader } from "@/components/ui/primitives";

import { formatDisplayDate } from "@/lib/finance/dates";
export const dynamic = "force-dynamic";

export default async function AvailableBudgetsPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <ErrorState level={1} title="Connect to view available budgets">
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
  let available;
  try {
    available = await listAvailableBudgets(context.client);
  } catch {
    return (
      <ErrorState level={1} title="Available budgets could not be loaded">
        <Link className="text-link" href="/budgets">
          Return to budgets
        </Link>
      </ErrorState>
    );
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Available budgets"
        title="Read-only available budget resources"
        lede="Firefly exposes available budgets read-only. The frontend does not offer create or delete controls."
        actions={
          <Link className="text-link" href="/budgets">
            Back to budgets
          </Link>
        }
      />
      <section className="panel">
        {available.length === 0 ? (
          <p className="muted-note">No available budgets reported.</p>
        ) : (
          <table className="data-table">
            <caption>Available budgets</caption>
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col">Amount</th>
                <th scope="col">Spent</th>
              </tr>
            </thead>
            <tbody>
              {available.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.start
                      ? `${formatDisplayDate(item.start)} – ${item.end ? formatDisplayDate(item.end) : ""}`
                      : `Available budget ${item.id}`}
                  </td>
                  <td>
                    <MoneyDisplay
                      amount={item.amount}
                      currency={item.currencyCode}
                      decimalPlaces={item.decimalPlaces}
                    />
                  </td>
                  <td>{item.spent ?? "Not reported"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
