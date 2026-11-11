import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import {
  getTransactionGroup,
  loadEditorOptions,
} from "@/features/transactions/service";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { ErrorState } from "@/components/shell/states";

export const dynamic = "force-dynamic";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <ErrorState level={1} title="Connect to edit transactions">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState level={1} title="Transaction editing is blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  }

  let group;
  let options;
  try {
    [group, options] = await Promise.all([
      getTransactionGroup(context.client, id),
      loadEditorOptions(context.client),
    ]);
  } catch {
    return (
      <ErrorState level={1} title="Transaction could not be loaded">
        <Link className="text-link" href="/transactions">
          Return to transactions
        </Link>
      </ErrorState>
    );
  }
  if (!group) notFound();

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Edit transaction group {group.id}</p>
        <h1>{group.title}</h1>
        <p className="lede">
          Every retained split is sent with its journal identity. Removing a
          split from this form intentionally deletes it on save.
        </p>
        <TransactionForm mode="edit" group={group} options={options} />
        <p className="muted-note">
          <Link className="text-link" href={`/transactions/${group.id}`}>
            Cancel and return to the transaction
          </Link>
        </p>
      </section>
    </div>
  );
}
