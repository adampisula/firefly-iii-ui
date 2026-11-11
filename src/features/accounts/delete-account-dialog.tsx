"use client";

import { useActionState, useState } from "react";
import { Button, Dialog, ErrorSummary } from "@/components/ui/primitives";
import { deleteAccountAction, type AccountActionState } from "./actions";

const INITIAL: AccountActionState = { ok: false, message: "", errors: {} };

export function DeleteAccountDialog({
  accountId,
  accountName,
}: {
  accountId: string;
  accountName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteAccountAction,
    INITIAL,
  );

  return (
    <>
      <Button type="button" tone="danger" onClick={() => setOpen(true)}>
        Delete account
      </Button>
      <Dialog
        open={open}
        title={`Delete ${accountName}`}
        onOpenChange={setOpen}
      >
        <form action={formAction} className="form-stack">
          <input type="hidden" name="account_id" value={accountId} />
          {state.message ? (
            <ErrorSummary
              errors={[{ id: "delete-account", message: state.message }]}
            />
          ) : null}
          <p>
            This asks Firefly to delete the account. Firefly may reject the
            deletion when the account has linked transactions or other
            dependencies. The frontend never chooses a replacement account and
            never silently reassigns transactions.
          </p>
          <p className="muted-note">
            This cannot be undone. Review the account detail and transaction
            relationships before confirming.
          </p>
          <label className="checkbox-row">
            <input type="checkbox" name="confirm_delete" required value="yes" />
            <span>I understand this permanently deletes the account.</span>
          </label>
          <div className="button-row">
            <Button type="submit" tone="danger" disabled={pending}>
              {pending ? "Deleting..." : "Delete account"}
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
