"use client";

import { useActionState, useState } from "react";
import { Button, Dialog, ErrorSummary } from "@/components/ui/primitives";
import {
  deleteJournalAction,
  deleteTransactionAction,
  type TransactionActionState,
} from "./actions";

const INITIAL: TransactionActionState = { ok: false, message: "", errors: {} };

function Confirm({
  title,
  buttonLabel,
  action,
  fields,
  explanation,
}: {
  title: string;
  buttonLabel: string;
  action: (
    state: TransactionActionState,
    formData: FormData,
  ) => Promise<TransactionActionState>;
  fields: Record<string, string>;
  explanation: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, INITIAL);
  return (
    <>
      <Button type="button" tone="danger" onClick={() => setOpen(true)}>
        {buttonLabel}
      </Button>
      <Dialog open={open} title={title} onOpenChange={setOpen}>
        <form action={formAction} className="form-stack">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          {state.message ? (
            <ErrorSummary
              errors={[
                { id: "transaction-delete-error", message: state.message },
              ]}
            />
          ) : null}
          <p>{explanation}</p>
          <label className="checkbox-row">
            <input type="checkbox" name="confirm_delete" required value="yes" />
            <span>I understand this deletion cannot be undone.</span>
          </label>
          <div className="button-row">
            <Button type="submit" tone="danger" disabled={pending}>
              {pending ? "Deleting..." : "Delete"}
            </Button>
            <Button type="button" tone="quiet" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function DeleteTransactionDialog({
  groupId,
  title,
}: {
  groupId: string;
  title: string;
}) {
  return (
    <Confirm
      title={`Delete ${title}`}
      buttonLabel="Delete transaction group"
      action={deleteTransactionAction}
      fields={{ group_id: groupId }}
      explanation="This deletes the whole transaction group, including every split. Firefly applies its own linked-data and permission checks."
    />
  );
}

export function DeleteJournalDialog({
  groupId,
  journalId,
}: {
  groupId: string;
  journalId: string;
}) {
  return (
    <Confirm
      title={`Delete journal ${journalId}`}
      buttonLabel="Delete this split"
      action={deleteJournalAction}
      fields={{ group_id: groupId, journal_id: journalId }}
      explanation="This deletes only this journal from the group. Other splits are retained. Firefly remains authoritative for the resulting group."
    />
  );
}
