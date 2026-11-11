import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { getAccount, accountTypeLabel } from "@/features/accounts/service";
import { ErrorState } from "@/components/shell/states";
import { MoneyDisplay, Status } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function ReconcilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <ErrorState level={1} title="Connect to view reconciliation context">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState level={1} title="Reconciliation is blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  }

  let account;
  try {
    account = await getAccount(context.client, id);
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

  const eligible =
    account.type === "asset" && account.active && account.role !== "ccAsset";
  const query = `account:"${account.name.replaceAll('"', "")}"`;

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Reconciliation context</p>
        <h1>{account.name}</h1>
        <p className="result-meta">
          <Status kind={eligible ? "success" : "warning"}>
            {eligible
              ? "Eligible asset account"
              : "Not eligible for reconciliation"}
          </Status>
          <Status kind="neutral">
            {accountTypeLabel(account.type, account.role)}
          </Status>
          <Status kind="neutral">
            {account.active ? "Active" : "Inactive"}
          </Status>
        </p>
        <p>
          Current backend balance:{" "}
          <MoneyDisplay
            amount={account.currentBalance}
            currency={account.currencyCode}
            decimalPlaces={account.decimalPlaces}
          />
        </p>
        <div className="button-row">
          <Link
            className="button-link"
            href={`/search?query=${encodeURIComponent(query)}`}
          >
            Inspect account transactions
          </Link>
          <Link className="text-link" href={`/accounts/${account.id}`}>
            Back to account
          </Link>
        </div>
      </section>

      <section className="panel" role="status">
        <h2>Statement matching is unavailable</h2>
        <p>
          Firefly 6.7.9 exposes no reconciliation API operation. There is no
          supported way to submit statement opening/closing amounts, mark the
          selected journals reconciled as a workflow, compute the discrepancy,
          or create the special corrective reconciliation transaction. A plain
          transfer or setting a reconciled flag is not equivalent.
        </p>
        <p>
          This page provides read-only account context only. The complete
          workflow is recorded as residual <strong>GAP-02</strong> and requires
          an explicit user scope decision for any native-backend fallback. It is
          not replaced by a fabricated reconciliation screen.
        </p>
        <ul>
          <li>No statement amounts are accepted or stored here.</li>
          <li>No journals are marked reconciled by this frontend.</li>
          <li>No corrective transaction is created.</li>
          <li>Unreconciling remains a native backend action.</li>
        </ul>
      </section>
    </div>
  );
}
