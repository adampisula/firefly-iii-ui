import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { getCurrency } from "@/features/currencies/service";
import {
  CurrencyActions,
  CurrencyForm,
  DeleteCurrency,
} from "@/features/currencies/currency-forms";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { Status } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function CurrencyDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!/^[A-Za-z]{3}$/.test(code)) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <ErrorState level={1} title="Connect to view this currency">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  let currency;
  let counts: Record<string, number | string> = {};
  try {
    currency = await getCurrency(context.client, code);
    const related = await Promise.all(
      (
        [
          "accounts",
          "available-budgets",
          "bills",
          "budget-limits",
          "recurrences",
          "rules",
          "transactions",
        ] as const
      ).map(async (resource) => {
        try {
          const r = await context!.client.request(
            `currencies.${resource}` as "currencies.accounts",
            { pathParameters: { currencyCode: code }, query: { limit: 1 } },
          );
          const data = (r.data as { data?: unknown[] }).data;
          return [resource, Array.isArray(data) ? data.length : 0] as const;
        } catch {
          return [resource, "unavailable"] as const;
        }
      }),
    );
    counts = Object.fromEntries(related);
  } catch {
    return (
      <ErrorState level={1} title="Currency could not be loaded">
        <Link className="text-link" href="/currencies">
          Return to currencies
        </Link>
      </ErrorState>
    );
  }
  if (!currency) notFound();
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Currency {currency.code}</p>
        <h1>
          {currency.name} ({currency.symbol})
        </h1>
        <p className="result-meta">
          <Status kind={currency.enabled ? "success" : "neutral"}>
            {currency.enabled ? "Enabled" : "Disabled"}
          </Status>
          {currency.primary ? <Status kind="success">Primary</Status> : null}
          {currency.default ? <Status kind="neutral">Default</Status> : null}
          <Status kind="neutral">{currency.decimalPlaces} decimals</Status>
        </p>
        <div className="button-row">
          <DeleteCurrency currency={currency} />
          <Link className="text-link" href="/currencies">
            Back to currencies
          </Link>
        </div>
      </section>
      <section className="panel">
        <h2>Enable, disable and primary</h2>
        <CurrencyActions currency={currency} />
      </section>
      <section className="panel">
        <h2>Related resources</h2>
        <dl className="detail-list">
          {Object.entries(counts).map(([key, count]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>
                {count === "unavailable"
                  ? "Endpoint unavailable"
                  : `${count} returned`}
              </dd>
            </div>
          ))}
        </dl>
        <PermissionState title="Currency exchange-rate export (CER) unavailable">
          <p>
            The declared <code>currencies.cer</code> operation is a known 6.7.9
            defect (HTTP 500 missing controller method). It is not redirected to
            a guessed endpoint or marked verified.
          </p>
        </PermissionState>
      </section>
      <section className="panel">
        <h2>Edit currency</h2>
        <CurrencyForm currency={currency} />
      </section>
    </div>
  );
}
