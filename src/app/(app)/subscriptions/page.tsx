import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { billGroupLabel, listBills } from "@/features/subscriptions/service";
import { BillForm } from "@/features/subscriptions/bill-forms";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { MoneyDisplay, PageHeader, Status } from "@/components/ui/primitives";

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

export default async function SubscriptionsPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Subscriptions</p>
          <h1>Connect to manage subscriptions</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState level={1} title="Subscriptions are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  }
  let bills;
  let currencies: { code: string; name: string }[] = [];
  try {
    const [billData, currencyData] = await Promise.all([
      listBills(context.client),
      context.client.request("currencies.index", { query: { limit: 100 } }),
    ]);
    bills = billData;
    currencies = mapCurrencies(currencyData.data).sort((left, right) =>
      left.code.localeCompare(right.code),
    );
  } catch {
    return (
      <ErrorState level={1} title="Subscriptions could not be loaded">
        <p>Check the connection and try again.</p>
      </ErrorState>
    );
  }
  const groups = new Map<string, typeof bills>();
  for (const bill of bills) {
    const key = billGroupLabel(bill);
    groups.set(key, [...(groups.get(key) ?? []), bill]);
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Subscriptions"
        title="Subscriptions and bills"
        lede="Expected payments, matching rules and timelines from Firefly. Canonical bills and subscription aliases share the same records."
      />
      <section className="panel">
        <h2>Subscription list</h2>
        {bills.length === 0 ? (
          <PermissionState title="No subscriptions">
            <p>Create a subscription below.</p>
          </PermissionState>
        ) : (
          <div className="page-stack">
            {[...groups.entries()].map(([group, groupBills]) => (
              <div key={group}>
                <h3>{group}</h3>
                <div
                  className="table-scroll"
                  tabIndex={0}
                  role="region"
                  aria-label={`Subscriptions in ${group}`}
                >
                  <table className="data-table">
                    <caption>{group} subscriptions</caption>
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Amount range</th>
                        <th scope="col">Frequency</th>
                        <th scope="col">Next expected</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupBills.map((bill) => (
                        <tr key={bill.id}>
                          <td>
                            <Link
                              className="text-link"
                              href={`/subscriptions/${bill.id}`}
                            >
                              {bill.name}
                            </Link>
                          </td>
                          <td>
                            <MoneyDisplay
                              amount={bill.amountMin}
                              currency={bill.currencyCode}
                              decimalPlaces={bill.decimalPlaces}
                            />{" "}
                            –{" "}
                            <MoneyDisplay
                              amount={bill.amountMax}
                              currency={bill.currencyCode}
                              decimalPlaces={bill.decimalPlaces}
                            />
                          </td>
                          <td>
                            {bill.repeatFreq} / {bill.skip} skip
                          </td>
                          <td>
                            {bill.nextExpectedMatch
                              ? bill.nextExpectedMatch.slice(0, 10)
                              : "Not scheduled"}
                          </td>
                          <td>
                            <Status kind={bill.active ? "success" : "neutral"}>
                              {bill.active ? "Active" : "Inactive"}
                            </Status>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="panel">
        <h2>Create subscription</h2>
        <BillForm currencies={currencies} />
      </section>
    </div>
  );
}
