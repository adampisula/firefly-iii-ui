import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { getAccount, accountTypeLabel } from "@/features/accounts/service";
import { DeleteAccountDialog } from "@/features/accounts/delete-account-dialog";
import { ErrorState, PermissionState } from "@/components/shell/states";
import { MoneyDisplay, Status } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "Not reported"}</dd>
    </div>
  );
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return (
      <ErrorState level={1} title="Connect to view this account">
        <Link className="text-link" href="/">
          Connect account
        </Link>
      </ErrorState>
    );
  }
  if (context.compatibility.status !== "verified") {
    return (
      <ErrorState level={1} title="Account access is blocked">
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
        <p>
          The account may have been deleted or you may not have permission to
          view it.
        </p>
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
        <p className="eyebrow">Account {account.id}</p>
        <h1>{account.name}</h1>
        <p className="result-meta">
          <Status kind={account.active ? "success" : "neutral"}>
            {account.active ? "Active" : "Inactive"}
          </Status>
          <Status kind="neutral">
            {accountTypeLabel(account.type, account.role)}
          </Status>
          <Status kind="neutral">
            {account.includeNetWorth
              ? "In net worth"
              : "Excluded from net worth"}
          </Status>
        </p>
        <p>
          <MoneyDisplay
            amount={account.currentBalance}
            currency={account.currencyCode}
            decimalPlaces={account.decimalPlaces}
          />
        </p>
        <div className="button-row">
          <Link className="button-link" href={`/accounts/${account.id}/edit`}>
            Edit account
          </Link>
          <DeleteAccountDialog
            accountId={account.id}
            accountName={account.name}
          />
        </div>
      </section>

      <section className="panel">
        <h2>Balance and identifiers</h2>
        <dl className="detail-list">
          <DetailRow label="Currency" value={account.currencyCode} />
          <DetailRow label="Opening balance" value={account.openingBalance} />
          <DetailRow
            label="Opening balance date"
            value={account.openingBalanceDate}
          />
          <DetailRow label="Virtual balance" value={account.virtualBalance} />
          <DetailRow label="IBAN" value={account.iban} />
          <DetailRow label="BIC" value={account.bic} />
          <DetailRow label="Account number" value={account.accountNumber} />
          <DetailRow label="Last activity" value={account.lastActivity} />
        </dl>
      </section>

      {account.type === "liability" ? (
        <section className="panel">
          <h2>Liability terms</h2>
          <dl className="detail-list">
            <DetailRow label="Liability type" value={account.liabilityType} />
            <DetailRow label="Direction" value={account.liabilityDirection} />
            <DetailRow label="Amount" value={account.liabilityAmount} />
            <DetailRow label="Start date" value={account.liabilityStartDate} />
            <DetailRow label="Interest" value={account.interest} />
            <DetailRow label="Interest period" value={account.interestPeriod} />
          </dl>
        </section>
      ) : null}

      {account.role === "ccAsset" ? (
        <section className="panel">
          <h2>Credit-card bookkeeping</h2>
          <dl className="detail-list">
            <DetailRow label="Payment type" value={account.creditCardType} />
            <DetailRow
              label="Monthly payment date"
              value={account.monthlyPaymentDate}
            />
          </dl>
          <p className="muted-note">
            This is a bookkeeping account. The frontend does not issue payments
            or control a bank-issued card.
          </p>
        </section>
      ) : null}

      {account.notes ? (
        <section className="panel">
          <h2>Notes</h2>
          <p className="pre-wrap">{account.notes}</p>
        </section>
      ) : null}

      <section className="panel">
        <h2>Related data</h2>
        <p>
          Transaction history, attachments and piggy banks are provided by the
          transaction, attachment and piggy-bank domain tasks. They are not
          fabricated here.
        </p>
        {account.type === "asset" ? (
          <PermissionState title="Statement reconciliation unavailable">
            <p>
              Firefly 6.7.9 exposes no reconciliation API operation. Review
              read-only eligibility context and the explicit GAP-02 residual.
            </p>
            <Link
              className="text-link"
              href={`/accounts/${account.id}/reconcile`}
            >
              Open reconciliation context
            </Link>
          </PermissionState>
        ) : null}
      </section>
    </div>
  );
}
