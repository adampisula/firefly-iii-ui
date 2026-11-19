import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { listCurrencies } from "@/features/currencies/service";
import { CurrencyForm } from "@/features/currencies/currency-forms";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { Status, PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function CurrenciesPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Currencies</p>
          <h1>Connect to manage currencies</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Currencies are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let currencies;
  try {
    currencies = await listCurrencies(context.client);
  } catch {
    return (
      <ErrorState level={1} title="Currencies could not be loaded">
        <p>Check the connection.</p>
      </ErrorState>
    );
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Currencies"
        title="Currencies and primary currency"
        lede="Enable/disable, create/update and choose primary. Disabling an in-use currency is rejected; amounts are never relabeled."
        actions={
          <Link className="text-link" href="/exchange-rates">
            Exchange rates
          </Link>
        }
      />
      <section className="panel">
        <h2>Currency list</h2>
        {currencies.length === 0 ? (
          <PermissionState title="No currencies">
            <p>Create one below.</p>
          </PermissionState>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Currencies"
          >
            <table className="data-table">
              <caption>Currencies</caption>
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">Name</th>
                  <th scope="col">Decimals</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((currency) => (
                  <tr key={currency.id}>
                    <td>
                      <Link
                        className="text-link"
                        href={`/currencies/${currency.code}`}
                      >
                        {currency.code}
                      </Link>
                    </td>
                    <td>
                      {currency.name} ({currency.symbol})
                    </td>
                    <td>{currency.decimalPlaces}</td>
                    <td>
                      <Status kind={currency.enabled ? "success" : "neutral"}>
                        {currency.enabled ? "Enabled" : "Disabled"}
                      </Status>
                      {currency.primary ? " · primary" : ""}
                      {currency.default ? " · default" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="panel">
        <h2>Create currency</h2>
        <CurrencyForm />
      </section>
    </div>
  );
}
