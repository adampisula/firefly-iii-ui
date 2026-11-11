"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, ErrorSummary } from "@/components/ui/primitives";
import type { TransactionGroupView } from "@/features/transactions/service";
import type { LinkType, TransactionLink } from "./service";
import {
  cloneTransactionAction,
  convertTransactionAction,
  createLinkAction,
  deleteLinkAction,
  type LinkActionState,
} from "./actions";

const INITIAL: LinkActionState = { ok: false, message: "", errors: {} };

function Message({ state }: { state: LinkActionState }) {
  if (!state.message && Object.keys(state.errors).length === 0) return null;
  const errors = Object.entries(state.errors).map(([field, message]) => ({
    id: field,
    message: `${field}: ${message}`,
  }));
  return (
    <ErrorSummary
      title={state.ok ? "Saved" : state.message}
      errors={
        errors.length > 0
          ? errors
          : [{ id: "link-message", message: state.message }]
      }
    />
  );
}

function CloneForm({
  groupId,
  mode,
}: {
  groupId: string;
  mode: "view" | "edit";
}) {
  const [state, formAction, pending] = useActionState(
    cloneTransactionAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="inline-form">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="mode" value={mode} />
      <Button type="submit" tone="quiet" disabled={pending}>
        {pending
          ? "Cloning..."
          : mode === "edit"
            ? "Clone and edit"
            : "Clone transaction"}
      </Button>
      {state.message ? (
        <span className="muted-note">{state.message}</span>
      ) : null}
    </form>
  );
}

function ConvertForm({
  groupId,
  currentType,
}: {
  groupId: string;
  currentType: string;
}) {
  const [state, formAction, pending] = useActionState(
    convertTransactionAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      <input type="hidden" name="group_id" value={groupId} />
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="convert-type">
            Convert all splits to
          </label>
          <select
            className="select"
            id="convert-type"
            name="target_type"
            defaultValue={
              currentType === "withdrawal" ? "deposit" : "withdrawal"
            }
          >
            <option value="withdrawal">Withdrawal</option>
            <option value="deposit">Deposit</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
        <Button type="submit" tone="quiet" disabled={pending}>
          {pending ? "Converting..." : "Convert type"}
        </Button>
      </div>
      <Message state={state} />
      <p className="muted-note">
        Conversion swaps account direction for withdrawal/deposit. A transfer is
        only allowed when both sides are asset or liability accounts. Reconciled
        rows are rejected.
      </p>
    </form>
  );
}

function CreateLinkForm({
  groupId,
  journalId,
  linkTypes,
}: {
  groupId: string;
  journalId: string;
  linkTypes: readonly LinkType[];
}) {
  const [state, formAction, pending] = useActionState(
    createLinkAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="current_journal" value={journalId} />
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor={`link-type-${journalId}`}>
            Link type
          </label>
          <select
            className="select"
            id={`link-type-${journalId}`}
            name="link_type_id"
            required
          >
            <option value="">Choose link type</option>
            {linkTypes.map((linkType) => (
              <option key={linkType.id} value={linkType.id}>
                {linkType.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor={`link-other-${journalId}`}>
            Other journal ID
          </label>
          <input
            className="select"
            id={`link-other-${journalId}`}
            name="other_journal"
            inputMode="numeric"
            required
          />
        </div>
        <div className="field-group">
          <label
            className="field-label"
            htmlFor={`link-direction-${journalId}`}
          >
            This journal is
          </label>
          <select
            className="select"
            id={`link-direction-${journalId}`}
            name="direction"
            defaultValue="inward"
          >
            <option value="inward">Inward</option>
            <option value="outward">Outward</option>
          </select>
        </div>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor={`link-notes-${journalId}`}>
          Link notes (optional)
        </label>
        <input className="select" id={`link-notes-${journalId}`} name="notes" />
      </div>
      <Button type="submit" tone="quiet" disabled={pending}>
        {pending ? "Linking..." : "Create link"}
      </Button>
      <Message state={state} />
    </form>
  );
}

function UnlinkRow({
  link,
  groupId,
  linkTypes,
}: {
  link: TransactionLink;
  groupId: string;
  linkTypes: readonly LinkType[];
}) {
  const [state, formAction, pending] = useActionState(
    deleteLinkAction,
    INITIAL,
  );
  const type = linkTypes.find((item) => item.id === link.linkTypeId);
  return (
    <li>
      <form action={formAction} className="inline-form">
        <input type="hidden" name="link_id" value={link.id} />
        <input type="hidden" name="group_id" value={groupId} />
        <span>
          {type?.name ?? `Link type ${link.linkTypeId}`}: {link.inwardId} →{" "}
          {link.outwardId}
          {link.notes ? (
            <span className="muted-note"> · {link.notes}</span>
          ) : null}
        </span>
        <label className="checkbox-row">
          <input type="checkbox" name="confirm_delete" value="yes" required />
          <span>Confirm unlink {link.id}</span>
        </label>
        <Button type="submit" tone="danger" disabled={pending}>
          {pending ? "Removing..." : "Unlink"}
        </Button>
        {state.message ? (
          <span className="muted-note">{state.message}</span>
        ) : null}
      </form>
    </li>
  );
}

export function TransactionActionsPanel({
  group,
  selectedJournalId,
  linkTypes,
  links,
}: {
  group: TransactionGroupView;
  selectedJournalId: string | null;
  linkTypes: readonly LinkType[];
  links: readonly TransactionLink[];
}) {
  const journalId = selectedJournalId ?? group.journals[0]?.journalId ?? "";
  const journal = group.journals.find((item) => item.journalId === journalId);
  const currentType = journal?.type ?? "withdrawal";

  return (
    <div className="page-stack">
      <section className="panel">
        <h2>Clone and convert</h2>
        <p>
          Clone strips journal identities and reconciled state. Conversion keeps
          every journal ID and uses the existing transaction update contract.
        </p>
        <div className="button-row">
          <CloneForm groupId={group.id} mode="view" />
          <CloneForm groupId={group.id} mode="edit" />
        </div>
        <ConvertForm groupId={group.id} currentType={currentType} />
      </section>

      <section className="panel">
        <h2>Journal links</h2>
        <p>
          Linking affects the selected journal ({journalId || "none"}). Existing
          links are read from the journal endpoint; unlinking removes only the
          link record.
        </p>
        {journalId ? (
          <CreateLinkForm
            groupId={group.id}
            journalId={journalId}
            linkTypes={linkTypes}
          />
        ) : null}
        <ul className="link-list">
          {links
            .filter(
              (link) =>
                link.inwardId === journalId || link.outwardId === journalId,
            )
            .map((link) => (
              <UnlinkRow
                key={link.id}
                link={link}
                groupId={group.id}
                linkTypes={linkTypes}
              />
            ))}
        </ul>
        <p className="muted-note">
          Manage link-type names and directions in{" "}
          <Link className="text-link" href="/link-types">
            link types
          </Link>
          .
        </p>
      </section>

      <section className="panel">
        <h2>Selection actions</h2>
        <p>
          Mass edit, the bulk editor and mass deletion have no supported Firefly
          6.7.9 API equivalent beyond per-resource operations. They remain an
          explicit GAP-06 residual and are not replaced by the narrow data-bulk
          endpoint. Use individual group edits and confirmed deletions.
        </p>
      </section>
    </div>
  );
}
