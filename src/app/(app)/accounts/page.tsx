import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { listAccounts, accountTypeLabel } from "@/features/accounts/service";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { MoneyDisplay, Status } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

const TYPE_OPTIONS = [
  { value: "all", label: "All account types" },
  { value: "asset", label: "Asset" },
  { value: "expense", label: "Expense" },
  { value: "revenue", label: "Revenue" },
  { value: "liability", label: "Liability" },
];

function href(type: string, includeInactive: boolean, page: number): string {
  const params = new URLSearchParams();
  if (type !== "all") params.set("type", type);
  if (includeInactive) params.set("inactive", "1");
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/accounts?${query}` : "/accounts";
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const rawType = Array.isArray(resolved.type)
    ? resolved.type[0]
    : resolved.type;
  const type = TYPE_OPTIONS.some((option) => option.value === rawType)
    ? (rawType as string)
    : "all";
  const rawInactive = Array.isArray(resolved.inactive)
    ? resolved.inactive[0]
    : resolved.inactive;
  const includeInactive = rawInactive === "1";
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
          <p className="eyebrow">Accounts</p>
          <h1>Connect to manage accounts</h1>
          <p>Account data is read and written through your Firefly backend.</p>
          <Link className="button-link" href="/">
            Connect account
          </Link>
        </section>
      </div>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState title="Accounts are blocked">
        <p>
          This session could not verify Firefly III 6.7.9. Reconnect after
          confirming the backend version.
        </p>
      </ErrorState>
    );
  }

  let list;
  try {
    list = await listAccounts(context.client, {
      type,
      active: includeInactive ? undefined : true,
      page,
    });
  } catch {
    return (
      <ErrorState title="Accounts could not be loaded">
        <p>Firefly did not return the account list. Check the connection.</p>
      </ErrorState>
    );
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Accounts</p>
        <h1>Accounts and liabilities</h1>
        <p className="lede">
          Asset, expense, revenue and liability accounts from your Firefly
          administration. Balances are backend values, not locally computed.
        </p>
        <div className="button-row">
          <Link className="button-link" href="/accounts/new">
            Create account
          </Link>
        </div>
      </section>

      <section className="panel">
        <h2>Filter accounts</h2>
        <form className="search-form" action="/accounts" method="get">
          <div className="field-group">
            <label className="field-label" htmlFor="account-filter-type">
              Account type
            </label>
            <select
              className="select"
              id="account-filter-type"
              name="type"
              defaultValue={type}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="inactive"
              value="1"
              defaultChecked={includeInactive}
            />
            <span>Include inactive accounts</span>
          </label>
          <button className="button-link" type="submit">
            Apply filters
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Account list</h2>
        {list.accounts.length === 0 ? (
          <PermissionState title="No accounts match this filter">
            <p>
              Create an account or include inactive accounts. Empty results are
              not replaced with sample balances.
            </p>
          </PermissionState>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Accounts"
          >
            <table className="data-table">
              <caption>Accounts</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Type</th>
                  <th scope="col">Balance</th>
                  <th scope="col">Status</th>
                  <th scope="col">Net worth</th>
                </tr>
              </thead>
              <tbody>
                {list.accounts.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <Link
                        className="text-link"
                        href={`/accounts/${account.id}`}
                      >
                        {account.name}
                      </Link>
                      <span className="muted-note"> ID {account.id}</span>
                    </td>
                    <td>{accountTypeLabel(account.type, account.role)}</td>
                    <td>
                      <MoneyDisplay
                        amount={account.currentBalance}
                        currency={account.currencyCode}
                        decimalPlaces={account.decimalPlaces}
                      />
                    </td>
                    <td>
                      <Status kind={account.active ? "success" : "neutral"}>
                        {account.active ? "Active" : "Inactive"}
                      </Status>
                    </td>
                    <td>{account.includeNetWorth ? "Included" : "Excluded"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <nav className="pager" aria-label="Account pages">
          {page > 1 ? (
            <Link
              className="text-link"
              href={href(type, includeInactive, page - 1)}
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
              href={href(type, includeInactive, page + 1)}
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
