import Link from "next/link";
import { PageHeader } from "@/components/ui/primitives";
export const dynamic = "force-dynamic";
export default function ReportsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Reports"
        title="Report families are unsupported"
        lede="Firefly 6.7.9 has no report-data API. The legacy report builder, audit before/after balances and combined counterparty matrices cannot be reproduced without inventing behavior."
        actions={
          <>
            <Link className="button-link" href="/insights">
              Open supported insights
            </Link>
            <Link className="text-link" href="/">
              Dashboard
            </Link>
          </>
        }
      />
      <section className="panel">
        <p>
          <strong>Residual GAP-03:</strong> supported summary/chart/insight
          aggregates are available under the dashboard and Insights; report
          families require an explicit user scope choice for a native fallback.
        </p>
      </section>
      <section className="panel">
        <h2>What is not offered</h2>
        <ul>
          <li>No fabricated report builder or audit balances.</li>
          <li>No scraping of native report HTML.</li>
          <li>No backend extension or guessed endpoints.</li>
        </ul>
      </section>
    </div>
  );
}
