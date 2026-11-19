import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import {
  searchTransactionCount,
  searchTransactions,
  type SearchResults,
} from "@/features/search/service";
import { AccountSearchPanel } from "@/features/search/account-search-panel";
import { AutocompleteExplorer } from "@/features/search/autocomplete-explorer";
import { ErrorState, PermissionState } from "@/components/shell/states";
import {
  FilterBar,
  MoneyDisplay,
  PageHeader,
  Status,
} from "@/components/ui/primitives";

import { formatDisplayDate } from "@/lib/finance/dates";
export const dynamic = "force-dynamic";

const QUERY_HELP = [
  ['description:"coffee"', "Match a description phrase."],
  ["amount_more:10 amount_less:50", "Numeric amount boundaries."],
  ["date_after:2026-01-01 date_before:2026-12-31", "Inclusive date range."],
  ['type:withdrawal category:"Food"', "Transaction type and classification."],
  ['account:"Bank" tag:"holiday"', "Account or tag constraints."],
  ['-description:"refund"', "Exclude matching journals."],
];

function pageHref(query: string, page: number): string {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  return value ? `/search?${value}` : "/search";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const rawQuery = Array.isArray(resolved.query)
    ? resolved.query[0]
    : resolved.query;
  const query = (rawQuery ?? "").slice(0, 500);
  const rawPage = Array.isArray(resolved.page)
    ? resolved.page[0]
    : resolved.page;
  const requestedPage = Number(rawPage ?? 1);
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Search</p>
          <h1>Connect to search Firefly</h1>
          <p>
            Search and autocomplete read your existing Firefly data through
            server-side API calls. Connect a personal access token first.
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
      <ErrorState title="Search is blocked">
        <p>
          This session could not verify Firefly III 6.7.9. Reconnect after
          checking the backend version.
        </p>
      </ErrorState>
    );
  }

  let results: SearchResults | null = null;
  let count: number | null = null;
  let searchError: string | null = null;
  if (query) {
    try {
      [results, count] = await Promise.all([
        searchTransactions(context.client, query, page),
        searchTransactionCount(context.client, query),
      ]);
    } catch {
      searchError =
        "Firefly could not complete this search. Check the query syntax and connection.";
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Search"
        title="Find transactions and entities"
        lede="Transaction search uses Firefly's grammar. Autocomplete lookups cover every supported entity family."
      />
      <FilterBar>
        <form
          className="search-form"
          action="/search"
          method="get"
          role="search"
        >
          <div className="field-group">
            <label className="field-label" htmlFor="search-query">
              Transaction query
            </label>
            <input
              className="select"
              id="search-query"
              name="query"
              type="search"
              defaultValue={query}
              maxLength={500}
              placeholder='description:"coffee" amount_more:5'
            />
          </div>
          <button className="button-link" type="submit">
            Search transactions
          </button>
        </form>
        {query ? (
          <p className="muted-note">
            Query: <code>{query}</code>
          </p>
        ) : null}
      </FilterBar>

      <section className="panel">
        <h2>Query syntax</h2>
        <dl className="syntax-list">
          {QUERY_HELP.map(([example, description]) => (
            <div key={example}>
              <dt>
                <code>{example}</code>
              </dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
        <p className="muted-note">
          Malformed operators are reported by the backend. This frontend does
          not guess intent or silently drop invalid clauses.
        </p>
      </section>

      <section className="panel" id="transaction-results">
        <h2>Transaction results</h2>
        {searchError ? (
          <ErrorState title="Search failed">{searchError}</ErrorState>
        ) : !query ? (
          <PermissionState title="Enter a query">
            <p>
              Results appear here after you search. Empty matches are shown as
              zero results, not as a fabricated list.
            </p>
          </PermissionState>
        ) : results ? (
          <>
            <p className="result-meta">
              <Status kind="neutral">
                Page total {results.count} journal
                {results.count === 1 ? "" : "s"}
              </Status>{" "}
              <Status kind="neutral">
                Backend count endpoint {count ?? 0}
              </Status>{" "}
              {results.total !== null ? (
                <Status kind="neutral">Pagination total {results.total}</Status>
              ) : null}
            </p>
            <p className="muted-note">
              The count endpoint uses its own matching/summing semantics and is
              never presented as the unique transaction total.
            </p>

            {results.groups.length === 0 ? (
              <PermissionState title="No matching groups">
                <p>No transactions matched this query.</p>
              </PermissionState>
            ) : (
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Transaction search results"
              >
                <table className="data-table">
                  <caption>Transaction search results</caption>
                  <thead>
                    <tr>
                      <th scope="col">Group and journals</th>
                      <th scope="col">Date</th>
                      <th scope="col">Type</th>
                      <th scope="col">Amount</th>
                      <th scope="col">Accounts</th>
                      <th scope="col">Classification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.groups.map((group) => (
                      <tr key={group.id}>
                        <td>
                          <strong>{group.title}</strong>
                          <span className="muted-note">
                            {" "}
                            Group ID {group.id}
                          </span>
                          <ul className="journal-list">
                            {group.journals.map((journal) => (
                              <li key={journal.journalId}>
                                {journal.description}
                                <span className="muted-note">
                                  {" "}
                                  Journal ID {journal.journalId}
                                  {journal.reconciled ? " · reconciled" : ""}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td>
                          {group.journals[0]
                            ? formatDisplayDate(group.journals[0].date)
                            : "Not reported"}
                        </td>
                        <td>{group.journals[0]?.type ?? "Not reported"}</td>
                        <td>
                          {group.journals.map((journal) => (
                            <div key={`${journal.journalId}-amount`}>
                              <MoneyDisplay
                                amount={journal.amount}
                                currency={journal.currencyCode}
                                decimalPlaces={journal.decimalPlaces}
                              />
                            </div>
                          ))}
                        </td>
                        <td>
                          {group.journals.map((journal) => (
                            <div key={`${journal.journalId}-accounts`}>
                              {journal.sourceName} → {journal.destinationName}
                            </div>
                          ))}
                        </td>
                        <td>
                          {group.journals.map((journal) => (
                            <div key={`${journal.journalId}-classification`}>
                              {journal.categoryName ?? "Uncategorized"}
                              {journal.budgetName
                                ? ` · ${journal.budgetName}`
                                : ""}
                              {journal.tags.length > 0
                                ? ` · ${journal.tags.join(", ")}`
                                : ""}
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <nav className="pager" aria-label="Search result pages">
              {page > 1 ? (
                <Link className="text-link" href={pageHref(query, page - 1)}>
                  Previous page
                </Link>
              ) : (
                <span className="muted-note">Previous page</span>
              )}
              <span>
                Page {results.page} of {results.pageCount}
              </span>
              {page < results.pageCount ? (
                <Link className="text-link" href={pageHref(query, page + 1)}>
                  Next page
                </Link>
              ) : (
                <span className="muted-note">Next page</span>
              )}
            </nav>
          </>
        ) : null}
      </section>

      <section className="panel">
        <h2>Account search</h2>
        <AccountSearchPanel />
      </section>

      <section className="panel">
        <h2>Autocomplete families</h2>
        <AutocompleteExplorer />
      </section>
    </div>
  );
}
