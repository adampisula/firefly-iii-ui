import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import {
  getJournalLinks,
  getTransactionAttachments,
  getTransactionGroup,
  getTransactionPiggyEvents,
  transactionTypeLabel,
  type JournalLinkView,
} from "@/features/transactions/service";
import {
  DeleteJournalDialog,
  DeleteTransactionDialog,
} from "@/features/transactions/transaction-delete-dialogs";
import { listLinkTypes } from "@/features/transaction-actions/service";
import { TransactionActionsPanel } from "@/features/transaction-actions/transaction-actions-panel";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { MoneyDisplay, Status } from "@/components/ui/primitives";

import { formatDisplayDate } from "@/lib/finance/dates";
export const dynamic = "force-dynamic";

function valueOrMissing(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "")
    return "Not reported";
  return String(value);
}

function AccountRef({
  id,
  name,
  type,
}: {
  id: string;
  name: string;
  type: string;
}) {
  const href =
    type === "asset" || type === "liability" ? `/accounts/${id}` : null;
  return href ? (
    <Link className="text-link" href={href}>
      {name}
    </Link>
  ) : (
    <span>{name}</span>
  );
}

function LinksGroup({ links }: { links: readonly JournalLinkView[] }) {
  if (links.length === 0) {
    return (
      <p className="muted-note">
        No transaction links reported for this journal.
      </p>
    );
  }
  return (
    <ul className="journal-list">
      {links.map((link) => (
        <li key={link.id}>
          Link {link.id}: journal {link.inwardId} ↔ journal {link.outwardId}{" "}
          (type {link.linkTypeId})
          {link.notes ? (
            <span className="muted-note"> · {link.notes}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default async function TransactionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const resolved = await searchParams;
  const rawJournal = Array.isArray(resolved.journal)
    ? resolved.journal[0]
    : resolved.journal;
  const selectedJournalId =
    rawJournal && /^\d+$/.test(rawJournal) ? rawJournal : null;

  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <ErrorState level={1} title="Connect to view this transaction">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState level={1} title="Transaction access is blocked">
        <p>Reconnect after confirming Firefly III 6.7.9.</p>
      </ErrorState>
    );
  }

  let group;
  let attachments;
  let piggyEvents;
  let linksByJournal: { journalId: string; links: JournalLinkView[] }[] = [];
  let linkTypes = [];
  try {
    group = await getTransactionGroup(context.client, id);
    if (!group) notFound();
    [attachments, piggyEvents] = await Promise.all([
      getTransactionAttachments(context.client, group.id).catch(() => []),
      getTransactionPiggyEvents(context.client, group.id).catch(() => []),
    ]);
    [linksByJournal, linkTypes] = await Promise.all([
      Promise.all(
        group.journals.map(async (journal) => ({
          journalId: journal.journalId,
          links: await getJournalLinks(context.client, journal.journalId).catch(
            () => [],
          ),
        })),
      ),
      listLinkTypes(context.client).catch(() => []),
    ]);
  } catch {
    return (
      <ErrorState level={1} title="Transaction could not be loaded">
        <p>
          The transaction may have been deleted or you may not have permission
          to view it.
        </p>
        <Link className="text-link" href="/transactions">
          Return to transactions
        </Link>
      </ErrorState>
    );
  }

  const selected = selectedJournalId
    ? group.journals.find((journal) => journal.journalId === selectedJournalId)
    : undefined;

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Transaction group {group.id}</p>
        <h1>{group.title}</h1>
        <p className="result-meta">
          <Status kind="neutral">
            {group.journals.length} journal
            {group.journals.length === 1 ? "" : "s"}
          </Status>
          {selected ? (
            <Status kind="success">Selected split {selected.journalId}</Status>
          ) : null}
        </p>
        {selectedJournalId && !selected ? (
          <p className="muted-note">
            The requested journal does not belong to this group. No split is
            highlighted, and the group remains unchanged.
          </p>
        ) : null}
        <div className="button-row">
          <Link className="button-link" href={`/transactions/${group.id}/edit`}>
            Edit transaction
          </Link>
          <DeleteTransactionDialog groupId={group.id} title={group.title} />
          <Link className="text-link" href="/transactions">
            Back to transaction list
          </Link>
        </div>
      </section>

      {group.journals.map((journal) => {
        const links =
          linksByJournal.find((item) => item.journalId === journal.journalId)
            ?.links ?? [];
        const highlighted = selectedJournalId === journal.journalId;
        return (
          <section
            className="panel"
            key={journal.journalId}
            aria-labelledby={`journal-${journal.journalId}`}
            data-highlighted={highlighted || undefined}
          >
            <p className="eyebrow">
              Journal {journal.journalId} · order {journal.order}
            </p>
            <h2 id={`journal-${journal.journalId}`}>{journal.description}</h2>
            <p className="result-meta">
              <Status kind="neutral">
                {transactionTypeLabel(journal.type)}
              </Status>
              <Status kind={journal.reconciled ? "success" : "neutral"}>
                {journal.reconciled ? "Reconciled" : "Not reconciled"}
              </Status>
              <Status kind="neutral">
                <MoneyDisplay
                  amount={journal.amount}
                  currency={journal.currencyCode}
                  decimalPlaces={journal.decimalPlaces}
                />
              </Status>
              {journal.foreignAmount && journal.foreignCurrencyCode ? (
                <Status kind="neutral">
                  Foreign{" "}
                  <MoneyDisplay
                    amount={journal.foreignAmount}
                    currency={journal.foreignCurrencyCode}
                    decimalPlaces={journal.foreignDecimalPlaces}
                  />
                </Status>
              ) : null}
            </p>
            <dl className="detail-list">
              <div>
                <dt>Date</dt>
                <dd>{formatDisplayDate(journal.date)}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>
                  <AccountRef
                    id={journal.sourceId}
                    name={journal.sourceName}
                    type={journal.sourceType}
                  />
                  {journal.sourceIban ? ` · ${journal.sourceIban}` : ""}
                </dd>
              </div>
              <div>
                <dt>Destination</dt>
                <dd>
                  <AccountRef
                    id={journal.destinationId}
                    name={journal.destinationName}
                    type={journal.destinationType}
                  />
                  {journal.destinationIban
                    ? ` · ${journal.destinationIban}`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{valueOrMissing(journal.categoryName)}</dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>{valueOrMissing(journal.budgetName)}</dd>
              </div>
              <div>
                <dt>Subscription / bill</dt>
                <dd>{valueOrMissing(journal.billName)}</dd>
              </div>
              <div>
                <dt>Tags</dt>
                <dd>
                  {journal.tags.length > 0 ? journal.tags.join(", ") : "None"}
                </dd>
              </div>
              <div>
                <dt>Internal reference</dt>
                <dd>{valueOrMissing(journal.internalReference)}</dd>
              </div>
              <div>
                <dt>External ID</dt>
                <dd>{valueOrMissing(journal.externalId)}</dd>
              </div>
              <div>
                <dt>Original source</dt>
                <dd>{valueOrMissing(journal.originalSource)}</dd>
              </div>
              <div>
                <dt>Recurrence ID</dt>
                <dd>{valueOrMissing(journal.recurrenceId)}</dd>
              </div>
              <div>
                <dt>Interest date</dt>
                <dd>{valueOrMissing(journal.interestDate)}</dd>
              </div>
              <div>
                <dt>Book date</dt>
                <dd>{valueOrMissing(journal.bookDate)}</dd>
              </div>
              <div>
                <dt>Process date</dt>
                <dd>{valueOrMissing(journal.processDate)}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>{valueOrMissing(journal.dueDate)}</dd>
              </div>
              <div>
                <dt>Payment date</dt>
                <dd>{valueOrMissing(journal.paymentDate)}</dd>
              </div>
              <div>
                <dt>Invoice date</dt>
                <dd>{valueOrMissing(journal.invoiceDate)}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>
                  {journal.latitude !== null && journal.longitude !== null
                    ? `${journal.latitude}, ${journal.longitude} (zoom ${valueOrMissing(journal.zoomLevel)})`
                    : "No location"}
                </dd>
              </div>
            </dl>
            {journal.notes ? (
              <>
                <h3>Notes</h3>
                <p className="pre-wrap">{journal.notes}</p>
              </>
            ) : null}
            <h3>Links</h3>
            <LinksGroup links={links} />
            {!journal.reconciled && group.journals.length > 1 ? (
              <div className="button-row">
                <DeleteJournalDialog
                  groupId={group.id}
                  journalId={journal.journalId}
                />
              </div>
            ) : null}
          </section>
        );
      })}

      <TransactionActionsPanel
        group={group}
        selectedJournalId={selectedJournalId}
        linkTypes={linkTypes}
        links={linksByJournal.flatMap((item) =>
          item.links.map((link) => ({
            id: link.id,
            inwardId: link.inwardId,
            outwardId: link.outwardId,
            linkTypeId: link.linkTypeId,
            notes: link.notes,
          })),
        )}
      />

      <section className="panel">
        <h2>Attachments</h2>
        {attachments.length === 0 ? (
          <p className="muted-note">No attachments reported for this group.</p>
        ) : (
          <ul className="link-list">
            {attachments.map((attachment) => (
              <li key={attachment.id}>
                {attachment.title}
                <span className="muted-note">
                  {" "}
                  · {attachment.filename || "No filename"} ·{" "}
                  {attachment.mime || "Unknown type"} · {attachment.size} bytes
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="muted-note">
          Download and preview controls arrive with CORE-11. Only metadata is
          shown here.
        </p>
      </section>

      <section className="panel">
        <h2>Piggy-bank events</h2>
        {piggyEvents.length === 0 ? (
          <p className="muted-note">No piggy-bank events reported.</p>
        ) : (
          <ul className="link-list">
            {piggyEvents.map((event) => (
              <li key={event.id}>
                {event.piggyBankName ??
                  `Piggy bank ${event.piggyBankId ?? "unknown"}`}
                {event.date ? ` · ${formatDisplayDate(event.date)}` : ""} ·
                amount {event.amount}
                {event.journalId ? ` · journal ${event.journalId}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <PermissionState title="Audit log unavailable">
          <p>
            Firefly 6.7.9 exposes no audit-log API operation. The native
            audit-log workflow remains an explicit GAP-06 residual and is not
            simulated here.
          </p>
        </PermissionState>
      </section>
    </div>
  );
}
