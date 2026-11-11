import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { getTransactionJournalGroup } from "@/features/transactions/service";
import { ErrorState } from "@/components/shell/states";

export const dynamic = "force-dynamic";

export default async function JournalRedirectPage({
  params,
}: {
  params: Promise<{ journalId: string }>;
}) {
  const { journalId } = await params;
  if (!/^\d+$/.test(journalId)) notFound();

  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <ErrorState level={1} title="Connect to view this journal">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  }
  const group = await getTransactionJournalGroup(
    context.client,
    journalId,
  ).catch(() => null);
  if (!group) {
    return (
      <ErrorState level={1} title="Journal could not be resolved">
        <p>
          The journal may have been deleted, or it does not belong to an
          accessible transaction group.
        </p>
        <Link className="text-link" href="/transactions">
          Return to transactions
        </Link>
      </ErrorState>
    );
  }
  if (!group.journals.some((journal) => journal.journalId === journalId)) {
    return (
      <ErrorState level={1} title="Journal not found in group">
        <p>The backend returned a containing group without this journal.</p>
        <Link className="text-link" href={`/transactions/${group.id}`}>
          Open the containing group
        </Link>
      </ErrorState>
    );
  }
  redirect(`/transactions/${group.id}?journal=${journalId}`);
}
