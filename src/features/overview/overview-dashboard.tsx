import Link from "next/link";
import {
  BarChart,
  EmptyState,
  LineChart,
  MoneyDisplay,
  PageHeader,
  ProgressRow,
  StatGrid,
  StatTile,
  Status,
  type ChartPoint,
} from "@/components/ui/primitives";
import { accountTypeLabel } from "@/features/accounts/service";
import {
  chartLabel,
  summaryByKind,
  type OverviewBudget,
  type OverviewData,
  type SummaryEntry,
} from "./service";

const SUMMARY_ORDER = [
  { kind: "net-worth", label: "Net worth" },
  { kind: "balance", label: "Balance" },
  { kind: "left-to-spend", label: "Left to spend" },
  { kind: "spent", label: "Spent" },
  { kind: "earned", label: "Earned" },
  { kind: "bills-unpaid", label: "Unpaid bills" },
] as const;

function summaryLabel(kind: string): string {
  return (
    SUMMARY_ORDER.find((entry) => entry.kind === kind)?.label ??
    kind.replaceAll("-", " ")
  );
}

function toChartPoints(
  points: readonly {
    label: string;
    value: string;
    currencyCode: string;
    decimalPlaces: number;
  }[],
): ChartPoint[] {
  return points.map((point) => ({
    label: point.label,
    amount: point.value,
    currency: point.currencyCode,
    decimalPlaces: point.decimalPlaces,
  }));
}

function spentFor(budget: OverviewBudget, currencyCode: string): string | null {
  return (
    budget.budget.spent.find((spent) => spent.currencyCode === currencyCode)
      ?.sum ?? null
  );
}

function budgetCurrency(budget: OverviewBudget): string {
  return (
    budget.limit?.currencyCode ||
    budget.budget.spent[0]?.currencyCode ||
    budget.budget.currencyCode ||
    "EUR"
  );
}

function budgetDecimals(budget: OverviewBudget): number {
  return (
    budget.limit?.decimalPlaces ??
    budget.budget.spent[0]?.decimalPlaces ??
    budget.budget.decimalPlaces ??
    2
  );
}

function SummaryTiles({ entries }: { entries: readonly SummaryEntry[] }) {
  return (
    <StatGrid>
      {entries.map((entry) => (
        <StatTile
          key={entry.key}
          label={`${summaryLabel(entry.kind)}${entry.currencyCode ? ` (${entry.currencyCode})` : ""}`}
          value={
            <MoneyDisplay
              amount={entry.value}
              currency={entry.currencyCode || "EUR"}
              decimalPlaces={entry.decimalPlaces}
            />
          }
          hint={entry.subTitle || entry.title || "Reported by Firefly"}
          tone={entry.kind === "spent" ? "warn" : "neutral"}
        />
      ))}
    </StatGrid>
  );
}

function BudgetProgress({ budgets }: { budgets: readonly OverviewBudget[] }) {
  if (budgets.length === 0)
    return (
      <EmptyState title="No budgets reported">
        Create a budget to see progress here.
      </EmptyState>
    );
  return (
    <div>
      {budgets.map(({ budget, limit }) => {
        const currency = budgetCurrency({ budget, limit });
        const current = spentFor({ budget, limit }, currency) ?? "0";
        const percentage =
          limit && Number(limit.amount) > 0
            ? (Number(current) / Number(limit.amount)) * 100
            : null;
        return (
          <ProgressRow
            key={budget.id}
            label={budget.name}
            current={current}
            target={limit?.amount ?? null}
            currency={currency}
            decimalPlaces={budgetDecimals({ budget, limit })}
            percentage={percentage}
            detail={
              percentage !== null
                ? `${Math.round(percentage)}% of the current limit`
                : "No period limit reported for this range."
            }
          />
        );
      })}
    </div>
  );
}

export function OverviewDashboard({
  data,
  userEmail,
}: {
  data: OverviewData;
  userEmail: string;
}) {
  const orderedSummary = SUMMARY_ORDER.flatMap(({ kind }) =>
    summaryByKind(data.summary, kind),
  );
  const transactions = data.transactions.slice(0, 8);

  return (
    <div className="page-stack overview-stack">
      <PageHeader
        eyebrow="Overview"
        title="Your money at a glance"
        lede={
          <>
            {data.range.label} · {data.range.start} to {data.range.end} ·
            Connected as {userEmail}
          </>
        }
        actions={
          <>
            <Link className="button-link" href="/transactions/new">
              New transaction
            </Link>
            <Link className="text-link" href="/search">
              Search
            </Link>
          </>
        }
      />

      {data.errors.length > 0 ? (
        <section className="panel" aria-label="Partial data warnings">
          <Status kind="warning">Some sections could not be loaded</Status>
          <ul>
            {data.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          <p className="muted-note">
            Successful sections remain available. Check the connection before
            retrying.
          </p>
        </section>
      ) : null}

      {orderedSummary.length > 0 ? (
        <SummaryTiles entries={orderedSummary} />
      ) : (
        <section className="panel">
          <EmptyState title="No summary data reported">
            Firefly did not return summary values for this range and currency.
            Choose another date range or check the connection.
          </EmptyState>
        </section>
      )}

      <div className="overview-chart-grid">
        <section className="panel">
          <LineChart
            title="Balance over time"
            summary={chartLabel(data.balance)}
            points={toChartPoints(data.balance)}
          />
        </section>
        <section className="panel">
          <BarChart
            title="Income"
            summary={chartLabel(data.income)}
            points={toChartPoints(data.income)}
          />
        </section>
        <section className="panel">
          <BarChart
            title="Expenses"
            summary={chartLabel(data.expense)}
            points={toChartPoints(data.expense)}
          />
        </section>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Money</p>
            <h2>Accounts</h2>
          </div>
          <Link className="text-link" href="/accounts">
            All accounts
          </Link>
        </div>
        {data.accounts.length === 0 ? (
          <EmptyState title="No active accounts reported">
            Add an asset or liability account in Firefly to see balances here.
          </EmptyState>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Dashboard accounts"
          >
            <table className="data-table">
              <caption>Accounts included in this overview</caption>
              <thead>
                <tr>
                  <th scope="col">Account</th>
                  <th scope="col">Type</th>
                  <th scope="col">Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.accounts.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <Link
                        className="text-link"
                        href={`/accounts/${account.id}`}
                      >
                        {account.name}
                      </Link>
                    </td>
                    <td>{accountTypeLabel(account.type, account.role)}</td>
                    <td>
                      <MoneyDisplay
                        amount={account.currentBalance}
                        currency={account.currencyCode}
                        decimalPlaces={account.decimalPlaces}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Activity</p>
            <h2>Recent transactions</h2>
          </div>
          <Link className="text-link" href="/transactions">
            All transactions
          </Link>
        </div>
        {transactions.length === 0 ? (
          <EmptyState title="No transactions in this range">
            Adjust the date range or add a transaction.
          </EmptyState>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Recent transactions"
          >
            <table className="data-table">
              <caption>Recent transactions in the selected range</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Description</th>
                  <th scope="col">Account</th>
                  <th scope="col">Category or budget</th>
                  <th scope="col">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((group) => {
                  const journal = group.journals[0];
                  if (!journal) return null;
                  return (
                    <tr key={group.id}>
                      <td>{journal.date.slice(0, 10)}</td>
                      <td>
                        <Link
                          className="text-link"
                          href={`/transactions/${group.id}`}
                        >
                          {group.title || journal.description}
                        </Link>
                        {group.journals.length > 1 ? (
                          <span className="muted-note">
                            {" "}
                            · split ({group.journals.length} journals)
                          </span>
                        ) : null}
                      </td>
                      <td>{journal.sourceName}</td>
                      <td>
                        {journal.categoryName ??
                          journal.budgetName ??
                          "Unassigned"}
                      </td>
                      <td>
                        <MoneyDisplay
                          amount={journal.amount}
                          currency={journal.currencyCode}
                          decimalPlaces={journal.decimalPlaces}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="overview-widget-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Planning</p>
              <h2>Budget progress</h2>
            </div>
            <Link className="text-link" href="/budgets">
              Budgets
            </Link>
          </div>
          <BudgetProgress budgets={data.budgets} />
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Planning</p>
              <h2>Upcoming subscriptions</h2>
            </div>
            <Link className="text-link" href="/subscriptions">
              All subscriptions
            </Link>
          </div>
          {data.bills.length === 0 ? (
            <EmptyState title="No active subscriptions">
              Expected payments appear here when Firefly reports them.
            </EmptyState>
          ) : (
            <ul className="overview-list">
              {data.bills.map((bill) => (
                <li key={bill.id}>
                  <div>
                    <Link
                      className="text-link"
                      href={`/subscriptions/${bill.id}`}
                    >
                      {bill.name}
                    </Link>
                    <span className="muted-note">
                      {bill.repeatFreq} ·{" "}
                      {bill.nextExpectedMatch
                        ? bill.nextExpectedMatch.slice(0, 10)
                        : "Not scheduled"}
                    </span>
                  </div>
                  <span className="overview-list-amount">
                    <MoneyDisplay
                      amount={bill.amountMin}
                      currency={bill.currencyCode}
                      decimalPlaces={bill.decimalPlaces}
                    />
                    {" – "}
                    <MoneyDisplay
                      amount={bill.amountMax}
                      currency={bill.currencyCode}
                      decimalPlaces={bill.decimalPlaces}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Planning</p>
              <h2>Savings goals</h2>
            </div>
            <Link className="text-link" href="/piggy-banks">
              All goals
            </Link>
          </div>
          {data.piggyBanks.length === 0 ? (
            <EmptyState title="No savings goals">
              Piggy banks and reserved amounts appear here.
            </EmptyState>
          ) : (
            <div>
              {data.piggyBanks.map((piggy) => {
                const account = piggy.accounts[0];
                return (
                  <ProgressRow
                    key={piggy.id}
                    label={piggy.name}
                    current={account?.currentAmount ?? piggy.currentAmount}
                    target={piggy.targetAmount || null}
                    currency={account?.currencyCode ?? "EUR"}
                    decimalPlaces={account?.decimalPlaces ?? 2}
                    percentage={piggy.percentage}
                    detail={
                      piggy.targetDate
                        ? `Target date ${piggy.targetDate.slice(0, 10)}`
                        : "No target date reported"
                    }
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
