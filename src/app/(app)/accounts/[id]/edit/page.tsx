import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { getAccount } from "@/features/accounts/service";
import { AccountForm } from "@/features/accounts/account-form";
import { ErrorState } from "@/components/shell/states";

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

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <ErrorState level={1} title="Connect to edit this account">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState level={1} title="Account editing is blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  }

  let account;
  let currencies: { code: string; name: string }[] = [];
  try {
    const [accountResponse, currencyResponse] = await Promise.all([
      getAccount(context.client, id),
      context.client.request("currencies.index", { query: { limit: 100 } }),
    ]);
    account = accountResponse;
    currencies = mapCurrencies(currencyResponse.data).sort((left, right) =>
      left.code.localeCompare(right.code),
    );
  } catch {
    return (
      <ErrorState level={1} title="Account could not be loaded">
        <Link className="text-link" href="/accounts">
          Return to accounts
        </Link>
      </ErrorState>
    );
  }
  if (!account) notFound();

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Edit account</p>
        <h1>{account.name}</h1>
        <p className="lede">
          Type and currency are immutable after creation. Opening balance and
          date remain paired. Backend field errors are shown against the form.
        </p>
        <AccountForm mode="edit" account={account} currencies={currencies} />
        <p className="muted-note">
          <Link className="text-link" href={`/accounts/${account.id}`}>
            Cancel and return to the account
          </Link>
        </p>
      </section>
    </div>
  );
}
