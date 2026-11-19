import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import {
  listBudgetLimits,
  listBudgets,
  type BudgetLimit,
} from "@/features/budgets/service";
import { BudgetForm } from "@/features/budgets/budget-forms";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { PageHeader, ProgressRow, Status } from "@/components/ui/primitives";

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

export default async function BudgetsPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Budgets</p>
          <h1>Connect to manage budgets</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState level={1} title="Budgets are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  }

  let budgets;
  let currencies: { code: string; name: string }[] = [];
  let limitByBudget = new Map<string, BudgetLimit>();
  try {
    const [budgetData, currencyData] = await Promise.all([
      listBudgets(context.client),
      context.client.request("currencies.index", { query: { limit: 100 } }),
    ]);
    budgets = budgetData;
    currencies = mapCurrencies(currencyData.data).sort((left, right) =>
      left.code.localeCompare(right.code),
    );
    const limits = await Promise.all(
      budgets
        .filter((budget) => budget.active)
        .slice(0, 24)
        .map(async (budget) => {
          try {
            const rows = await listBudgetLimits(context.client, budget.id);
            return rows[0] ? ([budget.id, rows[0]] as const) : null;
          } catch {
            return null;
          }
        }),
    );
    limitByBudget = new Map(
      limits.filter(
        (entry): entry is readonly [string, BudgetLimit] => !!entry,
      ),
    );
  } catch {
    return (
      <ErrorState level={1} title="Budgets could not be loaded">
        <p>Check the connection and try again.</p>
      </ErrorState>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Budgets"
        title="Budgets and period limits"
        lede="Spending and auto-budget configuration come from Firefly. Available-budget resources are read-only."
        actions={
          <>
            <Link className="text-link" href="/budgets/available">
              Available budgets
            </Link>
            <Link className="text-link" href="/budgets/without-budget">
              Transactions without budget
            </Link>
          </>
        }
      />

      <section className="panel">
        <h2>Budget list</h2>
        {budgets.length === 0 ? (
          <PermissionState title="No budgets">
            <p>Create a budget below.</p>
          </PermissionState>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Budgets"
          >
            <table className="data-table">
              <caption>Budgets</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Status</th>
                  <th scope="col">Spent</th>
                  <th scope="col">Auto budget</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((budget) => (
                  <tr key={budget.id}>
                    <td>
                      <Link
                        className="text-link"
                        href={`/budgets/${budget.id}`}
                      >
                        {budget.name}
                      </Link>
                      <span className="muted-note"> ID {budget.id}</span>
                    </td>
                    <td>
                      <Status kind={budget.active ? "success" : "neutral"}>
                        {budget.active ? "Active" : "Inactive"}
                      </Status>
                    </td>
                    <td>
                      {budget.spent.length === 0 ? (
                        "No spending reported"
                      ) : (
                        <div className="budget-progress-list">
                          {budget.spent.map((spent) => {
                            const limit = limitByBudget.get(budget.id);
                            return (
                              <ProgressRow
                                key={`${budget.id}-${spent.currencyCode}`}
                                label={`${budget.name} (${spent.currencyCode})`}
                                current={spent.sum}
                                target={
                                  limit &&
                                  limit.currencyCode === spent.currencyCode
                                    ? limit.amount
                                    : null
                                }
                                currency={spent.currencyCode}
                                decimalPlaces={spent.decimalPlaces}
                                detail={
                                  limit &&
                                  limit.currencyCode === spent.currencyCode
                                    ? "Current limit"
                                    : "No matching limit reported"
                                }
                              />
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td>
                      {budget.autoBudgetType === "none"
                        ? "None"
                        : `${budget.autoBudgetType} ${budget.autoBudgetAmount ?? ""} ${budget.autoBudgetPeriod ?? ""}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Create budget</h2>
        <BudgetForm currencies={currencies} />
      </section>
    </div>
  );
}
