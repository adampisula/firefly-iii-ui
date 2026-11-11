import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { loadEditorOptions } from "@/features/transactions/service";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { ErrorState } from "@/components/shell/states";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <ErrorState level={1} title="Connect to create transactions">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState level={1} title="Transaction creation is blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  }

  let options;
  try {
    options = await loadEditorOptions(context.client);
  } catch {
    return (
      <ErrorState level={1} title="Transaction options could not be loaded">
        <p>Firefly did not return accounts, currencies or classifications.</p>
      </ErrorState>
    );
  }
  if (options.currencies.length === 0) {
    return (
      <ErrorState level={1} title="No currencies available">
        <p>
          Complete the native backend first-run step before creating
          transactions.
        </p>
      </ErrorState>
    );
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">New transaction</p>
        <h1>Create a transaction</h1>
        <p className="lede">
          Positive amounts with an explicit type and account direction. Splits
          stay in one group and keep distinct journal identities after saving.
        </p>
        <TransactionForm mode="create" options={options} />
        <p className="muted-note">
          <Link className="text-link" href="/transactions">
            Return to transactions
          </Link>
        </p>
      </section>
    </div>
  );
}
