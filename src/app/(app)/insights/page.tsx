import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import {
  getInsight,
  INSIGHT_OPTIONS,
  rangeFromKey,
  type InsightOperation,
} from "@/features/analysis/service";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { MoneyDisplay } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const pick = (key: string) =>
    Array.isArray(resolved[key]) ? resolved[key][0] : resolved[key];
  const selected =
    INSIGHT_OPTIONS.find((option) => option.value === pick("insight")) ??
    INSIGHT_OPTIONS[0];
  const range = rangeFromKey(pick("range"));
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Insights</p>
          <h1>Connect to view insights</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Insights are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let points;
  try {
    points = await getInsight(
      context.client,
      selected.value as InsightOperation,
      range.start,
      range.end,
    );
  } catch {
    return (
      <ErrorState level={1} title="Insight could not be loaded">
        <p>Check the connection and date range.</p>
      </ErrorState>
    );
  }
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Insights</p>
        <h1>Expense, income and transfer insights</h1>
        <p className="lede">
          Backend aggregates for {range.label} ({range.start} to {range.end}).
          Aggregates are not a report builder.
        </p>
        <form className="search-form" action="/insights" method="get">
          <div className="field-group">
            <label className="field-label" htmlFor="insight-select">
              Insight
            </label>
            <select
              className="select"
              id="insight-select"
              name="insight"
              defaultValue={selected.value}
            >
              {INSIGHT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="insight-range">
              Range
            </label>
            <select
              className="select"
              id="insight-range"
              name="range"
              defaultValue={pick("range") ?? "this-month"}
            >
              <option value="this-month">This month</option>
              <option value="last-30-days">Last 30 days</option>
              <option value="year-to-date">Year to date</option>
              <option value="all">All time</option>
            </select>
          </div>
          <button className="button-link" type="submit">
            Load insight
          </button>
        </form>
      </section>
      <section className="panel">
        <h2>{selected.label}</h2>
        {points.length === 0 ? (
          <PermissionState title="No insight data">
            <p>No aggregate values were returned for this period.</p>
          </PermissionState>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label={selected.label}
          >
            <table className="data-table">
              <caption>{selected.label}</caption>
              <thead>
                <tr>
                  <th scope="col">Label</th>
                  <th scope="col">Amount</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr key={point.label}>
                    <td>{point.label}</td>
                    <td>
                      <MoneyDisplay
                        amount={point.value}
                        currency={point.currencyCode}
                        decimalPlaces={point.decimalPlaces}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
