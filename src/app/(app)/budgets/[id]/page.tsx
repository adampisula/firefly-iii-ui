import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import {
  budgetTransactions,
  getBudget,
  listBudgetLimits,
} from "@/features/budgets/service";
import {
  BudgetForm,
  DeleteBudgetDialog,
  DeleteLimitDialog,
  LimitForm,
} from "@/features/budgets/budget-forms";
import { ErrorState } from "@/components/shell/states";
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

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <ErrorState level={1} title="Connect to view this budget">
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

  let budget;
  let limits;
  let transactions;
  let currencies: { code: string; name: string }[] = [];
  try {
    [budget, limits, transactions, currencies] = await Promise.all([
      getBudget(context.client, id),
      listBudgetLimits(context.client, id),
      budgetTransactions(context.client, id),
      context.client
        .request("currencies.index", { query: { limit: 100 } })
        .then((response) =>
          mapCurrencies(response.data).sort((left, right) =>
            left.code.localeCompare(right.code),
          ),
        ),
    ]);
  } catch {
    return (
      <ErrorState level={1} title="Budget could not be loaded">
        <Link className="text-link" href="/budgets">
          Return to budgets
        </Link>
      </ErrorState>
    );
  }
  if (!budget) notFound();
  const defaultCurrency = budget.currencyCode || currencies[0]?.code || "EUR";

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Budget {budget.id}</p>
        <h1>{budget.name}</h1>
        <p className="result-meta">
          <Status kind={budget.active ? "success" : "neutral"}>
            {budget.active ? "Active" : "Inactive"}
          </Status>
          <Status kind="neutral">Order {budget.order}</Status>
          <Status kind="neutral">
            Auto budget: {budget.autoBudgetType}
            {budget.autoBudgetType !== "none"
              ? ` ${budget.autoBudgetAmount ?? ""} ${budget.autoBudgetPeriod ?? ""}`
              : ""}
          </Status>
        </p>
        <div className="button-row">
          <DeleteBudgetDialog id={budget.id} name={budget.name} />
          <Link className="text-link" href="/budgets">
            Back to budgets
          </Link>
        </div>
      </section>

      <section className="panel">
        <h2>Period limits</h2>
        {limits.length === 0 ? (
          <p className="muted-note">No period limits reported.</p>
        ) : (
          <div className="page-stack">
            {limits.map((limit) => (
              <details key={limit.id} className="panel">
                <summary>
                  <MoneyDisplay
                    amount={limit.amount}
                    currency={limit.currencyCode}
                    decimalPlaces={limit.decimalPlaces}
                  />{" "}
                  · {limit.start.slice(0, 10)} to {limit.end.slice(0, 10)}
                </summary>
                <p>
                  <Link
                    className="text-link"
                    href={`/budgets/${budget.id}/limits/${limit.id}`}
                  >
                    Inspect limit transactions
                  </Link>
                </p>
                <LimitForm
                  budgetId={budget.id}
                  limit={limit}
                  currencies={currencies}
                  defaultCurrency={defaultCurrency}
                />
                <div className="button-row">
                  <DeleteLimitDialog budgetId={budget.id} limitId={limit.id} />
                </div>
              </details>
            ))}
          </div>
        )}
        <h3>Add period limit</h3>
        <LimitForm
          budgetId={budget.id}
          currencies={currencies}
          defaultCurrency={defaultCurrency}
        />
      </section>

      <section className="panel">
        <h2>Budget transactions</h2>
        {transactions.groups.length === 0 ? (
          <p className="muted-note">No transactions assigned to this budget.</p>
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

      <section className="panel">
        <h2>Edit budget</h2>
        <BudgetForm budget={budget} currencies={currencies} />
      </section>
    </div>
  );
}
