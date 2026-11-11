"use client";

import { useActionState, useState } from "react";
import { Button, Dialog, ErrorSummary } from "@/components/ui/primitives";
import { deleteLinkTypeAction, type LinkActionState } from "./actions";

const INITIAL: LinkActionState = { ok: false, message: "", errors: {} };

export function DeleteLinkTypeDialog({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteLinkTypeAction,
    INITIAL,
  );
  return (
    <>
      <Button type="button" tone="danger" onClick={() => setOpen(true)}>
        Delete link type
      </Button>
      <Dialog open={open} title={`Delete ${name}`} onOpenChange={setOpen}>
        <form action={formAction} className="form-stack">
          <input type="hidden" name="link_type_id" value={id} />
          {state.message ? (
            <ErrorSummary
              errors={[{ id: "delete-link-type", message: state.message }]}
            />
          ) : null}
          <p>
            This asks Firefly to delete the link type. Existing links using it
            may be removed or rejected by the backend; review related
            transactions first.
          </p>
          <label className="checkbox-row">
            <input type="checkbox" name="confirm_delete" value="yes" required />
            <span>I understand this permanently deletes the link type.</span>
          </label>
          <div className="button-row">
            <Button type="submit" tone="danger" disabled={pending}>
              {pending ? "Deleting..." : "Delete link type"}
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
