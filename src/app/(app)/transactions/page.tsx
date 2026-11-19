import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import {
  TRANSACTION_TYPES,
  listTransactions,
  transactionTypeLabel,
  type TransactionGroupView,
} from "@/features/transactions/service";
import { ErrorState, PermissionState } from "@/components/shell/states";
import {
  FilterBar,
  MoneyDisplay,
  PageHeader,
  Status,
} from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

function href(options: {
  type: string;
  start: string;
  end: string;
  page: number;
}): string {
  const params = new URLSearchParams();
  if (options.type !== "default") params.set("type", options.type);
  if (options.start) params.set("start", options.start);
  if (options.end) params.set("end", options.end);
  if (options.page > 1) params.set("page", String(options.page));
  const query = params.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

function accountHref(id: string, type: string): string | null {
  return type === "asset" || type === "liability" ? `/accounts/${id}` : null;
}

function JournalSummary({ group }: { group: TransactionGroupView }) {
  return (
    <ul className="journal-list">
      {group.journals.map((journal) => (
        <li key={journal.journalId}>
          <Link
            className="text-link"
            href={`/transactions/${group.id}?journal=${journal.journalId}`}
          >
            {journal.description}
          </Link>
          <span className="muted-note">
            {" "}
            · Journal {journal.journalId} · order {journal.order}
            {journal.reconciled ? " · reconciled" : ""}
          </span>
          <div>
            <MoneyDisplay
              amount={journal.amount}
              currency={journal.currencyCode}
              decimalPlaces={journal.decimalPlaces}
            />
            {journal.foreignAmount && journal.foreignCurrencyCode ? (
              <>
                {" "}
                <span className="muted-note">foreign</span>{" "}
                <MoneyDisplay
                  amount={journal.foreignAmount}
                  currency={journal.foreignCurrencyCode}
                  decimalPlaces={journal.foreignDecimalPlaces}
                />
              </>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const pick = (key: string) =>
    Array.isArray(resolved[key]) ? resolved[key][0] : resolved[key];
  const rawType = pick("type");
  const type = TRANSACTION_TYPES.some((item) => item.value === rawType)
    ? (rawType as string)
    : "default";
  const start = /^\d{4}-\d{2}-\d{2}$/.test(pick("start") ?? "")
    ? (pick("start") as string)
    : "";
  const end = /^\d{4}-\d{2}-\d{2}$/.test(pick("end") ?? "")
    ? (pick("end") as string)
    : "";
  const requestedPage = Number(pick("page") ?? 1);
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Transactions</p>
          <h1>Connect to read transactions</h1>
          <p>
            Transaction lists and detail are read from your Firefly backend with
            your own session.
          </p>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState level={1} title="Transactions are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  }

  let list;
  try {
    list = await listTransactions(context.client, { type, start, end, page });
  } catch {
    return (
      <ErrorState level={1} title="Transactions could not be loaded">
        <p>Check the connection and date filters, then try again.</p>
      </ErrorState>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Transactions"
        title="Transaction history"
        lede="Groups and individual journals keep distinct identities. Split totals are not summed again in the frontend."
        actions={
          <Link className="button-link" href="/transactions/new">
            New transaction
          </Link>
        }
      />

      <FilterBar>
        <form className="search-form" action="/transactions" method="get">
          <div className="field-group">
            <label className="field-label" htmlFor="tx-type">
              Transaction type
            </label>
            <select
              className="select"
              id="tx-type"
              name="type"
              defaultValue={type}
            >
              {TRANSACTION_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="tx-start">
              Start date (optional)
            </label>
            <input
              className="select"
              id="tx-start"
              name="start"
              type="date"
              defaultValue={start}
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="tx-end">
              End date (optional)
            </label>
            <input
              className="select"
              id="tx-end"
              name="end"
              type="date"
              defaultValue={end}
            />
          </div>
          <button className="button-link" type="submit">
            Apply filters
          </button>
          <Link className="text-link" href="/transactions">
            All time, all default types
          </Link>
        </form>
      </FilterBar>

      <section className="panel">
        <h2>Results</h2>
        <p className="result-meta">
          <Status kind="neutral">
            Page total {list.groups.length} group
            {list.groups.length === 1 ? "" : "s"}
          </Status>
          {list.total !== null ? (
            <Status kind="neutral">Pagination total {list.total}</Status>
          ) : null}
        </p>
        {list.groups.length === 0 ? (
          <PermissionState title="No matching transactions">
            <p>
              No transaction groups matched this type and date range. Filters
              are retained in the URL.
            </p>
          </PermissionState>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Transaction groups"
          >
            <table className="data-table">
              <caption>Transaction groups</caption>
              <thead>
                <tr>
                  <th scope="col">Group and splits</th>
                  <th scope="col">Date</th>
                  <th scope="col">Type</th>
                  <th scope="col">Accounts</th>
                  <th scope="col">Classification</th>
                </tr>
              </thead>
              <tbody>
                {list.groups.map((group) => {
                  const first = group.journals[0];
                  return (
                    <tr key={group.id}>
                      <td>
                        <Link
                          className="text-link"
                          href={`/transactions/${group.id}`}
                        >
                          {group.title}
                        </Link>
                        <span className="muted-note"> Group ID {group.id}</span>
                        <JournalSummary group={group} />
                      </td>
                      <td>
                        {first
                          ? new Date(first.date).toLocaleDateString("en-US", {
                              timeZone: "UTC",
                            })
                          : "Not reported"}
                      </td>
                      <td>
                        {group.journals
                          .map((journal) => transactionTypeLabel(journal.type))
                          .filter(
                            (value, index, all) => all.indexOf(value) === index,
                          )
                          .join(", ")}
                      </td>
                      <td>
                        {group.journals.map((journal) => {
                          const href = accountHref(
                            journal.sourceId,
                            journal.sourceType,
                          );
                          return (
                            <div key={`${journal.journalId}-accounts`}>
                              {href ? (
                                <Link className="text-link" href={href}>
                                  {journal.sourceName}
                                </Link>
                              ) : (
                                journal.sourceName
                              )}{" "}
                              →{" "}
                              {accountHref(
                                journal.destinationId,
                                journal.destinationType,
                              ) ? (
                                <Link
                                  className="text-link"
                                  href={
                                    accountHref(
                                      journal.destinationId,
                                      journal.destinationType,
                                    ) as string
                                  }
                                >
                                  {journal.destinationName}
                                </Link>
                              ) : (
                                journal.destinationName
                              )}
                            </div>
                          );
                        })}
                      </td>
                      <td>
                        {group.journals.map((journal) => (
                          <div key={`${journal.journalId}-classification`}>
                            {journal.categoryName ?? "Uncategorized"}
                            {journal.budgetName
                              ? ` · ${journal.budgetName}`
                              : ""}
                            {journal.billName ? ` · ${journal.billName}` : ""}
                            {journal.tags.length > 0
                              ? ` · ${journal.tags.join(", ")}`
                              : ""}
                          </div>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <nav className="pager" aria-label="Transaction pages">
          {page > 1 ? (
            <Link
              className="text-link"
              href={href({ type, start, end, page: page - 1 })}
            >
              Previous page
            </Link>
          ) : (
            <span className="muted-note">Previous page</span>
          )}
          <span>
            Page {list.page} of {list.pageCount}
          </span>
          {page < list.pageCount ? (
            <Link
              className="text-link"
              href={href({ type, start, end, page: page + 1 })}
            >
              Next page
            </Link>
          ) : (
            <span className="muted-note">Next page</span>
          )}
        </nav>
      </section>
    </div>
  );
}
