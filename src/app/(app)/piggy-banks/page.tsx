import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { listPiggyBanks } from "@/features/piggy-banks/service";
import { PiggyForm } from "@/features/piggy-banks/piggy-forms";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { MoneyDisplay } from "@/components/ui/primitives";

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

function mapAccounts(
  payload: unknown,
): { id: string; name: string; type: string }[] {
  if (typeof payload !== "object" || payload === null) return [];
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];
  return data.flatMap((value) => {
    if (typeof value !== "object" || value === null) return [];
    const resource = value as { id?: unknown; attributes?: unknown };
    const attributes = (resource.attributes ?? {}) as Record<string, unknown>;
    const id = typeof resource.id === "string" ? resource.id : "";
    const name = typeof attributes.name === "string" ? attributes.name : "";
    const type = typeof attributes.type === "string" ? attributes.type : "";
    return id && name && (type === "asset" || type === "liability")
      ? [{ id, name, type }]
      : [];
  });
}

export default async function PiggyBanksPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return (
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Savings goals</p>
          <h1>Connect to manage savings goals</h1>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  if (context.compatibility.status !== "verified")
    return (
      <ErrorState level={1} title="Savings goals are blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  let pigs;
  let accounts: { id: string; name: string; type: string }[] = [];
  let currencies: { code: string; name: string }[] = [];
  try {
    const [pigData, accountData, currencyData] = await Promise.all([
      listPiggyBanks(context.client),
      context.client.request("accounts.index", { query: { limit: 100 } }),
      context.client.request("currencies.index", { query: { limit: 100 } }),
    ]);
    pigs = pigData;
    accounts = mapAccounts(accountData.data);
    currencies = mapCurrencies(currencyData.data);
  } catch {
    return (
      <ErrorState level={1} title="Savings goals could not be loaded">
        <p>Check the connection and try again.</p>
      </ErrorState>
    );
  }
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Savings goals</p>
        <h1>Piggy banks and reserved money</h1>
        <p className="lede">
          Targets, allocations and event history from Firefly. Reserved funds
          are bookkeeping allocations, not bank transfers.
        </p>
      </section>
      <section className="panel">
        <h2>Savings goals</h2>
        {pigs.length === 0 ? (
          <PermissionState title="No savings goals">
            <p>Create one below.</p>
          </PermissionState>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Savings goals"
          >
            <table className="data-table">
              <caption>Savings goals</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Current</th>
                  <th scope="col">Target</th>
                  <th scope="col">Progress</th>
                  <th scope="col">Group</th>
                </tr>
              </thead>
              <tbody>
                {pigs.map((pig) => (
                  <tr key={pig.id}>
                    <td>
                      <Link
                        className="text-link"
                        href={`/piggy-banks/${pig.id}`}
                      >
                        {pig.name}
                      </Link>
                    </td>
                    <td>
                      {pig.accounts.map((account) => (
                        <div key={account.accountId}>
                          <MoneyDisplay
                            amount={account.currentAmount}
                            currency={account.currencyCode}
                            decimalPlaces={account.decimalPlaces}
                          />
                        </div>
                      ))}
                    </td>
                    <td>
                      {pig.targetAmount ? (
                        <MoneyDisplay
                          amount={pig.targetAmount}
                          currency={pig.accounts[0]?.currencyCode ?? "EUR"}
                          decimalPlaces={pig.accounts[0]?.decimalPlaces ?? 2}
                        />
                      ) : (
                        "No target"
                      )}
                    </td>
                    <td>
                      {pig.percentage !== null
                        ? `${pig.percentage}%`
                        : "Not reported"}
                    </td>
                    <td>{pig.objectGroupTitle ?? "Ungrouped"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="panel">
        <h2>Create savings goal</h2>
        <PiggyForm accounts={accounts} currencies={currencies} />
      </section>
    </div>
  );
}
