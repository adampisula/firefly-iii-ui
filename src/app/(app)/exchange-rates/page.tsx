import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { listRates } from "@/features/currencies/service";
import { DeleteRate, RateForm } from "@/features/currencies/currency-forms";
import { ErrorState, PermissionState } from "@/components/shell/states";

export const dynamic = "force-dynamic";

export default async function ExchangeRatesPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Exchange rates</p>
          <h1>Connect to manage exchange rates</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Exchange rates are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let rates;
  try {
    rates = await listRates(context.client);
  } catch {
    return (
      <ErrorState level={1} title="Exchange rates could not be loaded">
        <p>Check the connection.</p>
      </ErrorState>
    );
  }
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Exchange rates</p>
        <h1>Dated exchange rates</h1>
        <p className="lede">
          Exact pair/date rates. Automatic rate downloads are a backend feature
          and are not simulated here.
        </p>
        <Link className="text-link" href="/currencies">
          Currencies
        </Link>
      </section>
      <section className="panel">
        <h2>Rates</h2>
        {rates.length === 0 ? (
          <PermissionState title="No exchange rates">
            <p>Create a dated rate below.</p>
          </PermissionState>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Exchange rates"
          >
            <table className="data-table">
              <caption>Exchange rates</caption>
              <thead>
                <tr>
                  <th scope="col">Pair</th>
                  <th scope="col">Date</th>
                  <th scope="col">Rate</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.id}>
                    <td>
                      {rate.from}/{rate.to}
                    </td>
                    <td>{rate.date?.slice(0, 10) ?? "Not dated"}</td>
                    <td>{rate.rate}</td>
                    <td>{rate.date ? <DeleteRate rate={rate} /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="panel">
        <h2>Create or update rate</h2>
        <RateForm />
      </section>
    </div>
  );
}
