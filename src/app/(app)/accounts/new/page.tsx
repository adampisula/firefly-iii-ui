import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
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

export default async function NewAccountPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <ErrorState level={1} title="Connect to create accounts">
        <p>Create accounts only after connecting your Firefly backend.</p>
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState level={1} title="Account creation is blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  }

  let currencies: { code: string; name: string }[] = [];
  try {
    const response = await context.client.request("currencies.index", {
      query: { limit: 100 },
    });
    currencies = mapCurrencies(response.data).sort((left, right) =>
      left.code.localeCompare(right.code),
    );
  } catch {
    return (
      <ErrorState level={1} title="Currencies could not be loaded">
        <p>Firefly did not return the currency list needed for this form.</p>
      </ErrorState>
    );
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">New account</p>
        <h1>Create an account</h1>
        <p className="lede">
          Supported fields and conditional requirements come from the Firefly
          6.7.9 account API. Opening balance and date must be paired.
        </p>
        <AccountForm mode="create" currencies={currencies} />
        <p className="muted-note">
          <Link className="text-link" href="/accounts">
            Return to accounts
          </Link>
        </p>
      </section>
    </div>
  );
}
