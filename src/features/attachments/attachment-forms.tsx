"use client";
import { useActionState, useState } from "react";
import { Button, Dialog, ErrorSummary } from "@/components/ui/primitives";
import { ATTACHABLE_TYPES, type AttachmentRecord } from "./service";
import {
  createAttachmentAction,
  deleteAttachmentAction,
  updateAttachmentAction,
  uploadAttachmentAction,
  type AttachmentActionState,
} from "./actions";

const INITIAL: AttachmentActionState = { ok: false, message: "", errors: {} };
function Messages({ state }: { state: AttachmentActionState }) {
  if (!state.message && Object.keys(state.errors).length === 0) return null;
  return (
    <ErrorSummary
      title={state.ok ? "Saved" : state.message}
      errors={Object.entries(state.errors).map(([field, message]) => ({
        id: field,
        message: `${field}: ${message}`,
      }))}
    />
  );
}
export function CreateAttachmentForm() {
  const [state, formAction, pending] = useActionState(
    createAttachmentAction,
    INITIAL,
  );
  return (
    <form
      action={formAction}
      className="form-stack"
      encType="multipart/form-data"
    >
      <Messages state={state} />
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="attachment-title">
            Title
          </label>
          <input
            className="select"
            id="attachment-title"
            name="title"
            required
            maxLength={255}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="attachment-type">
            Attach to
          </label>
          <select
            className="select"
            id="attachment-type"
            name="attachable_type"
            required
          >
            {ATTACHABLE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="attachment-id">
            Entity ID
          </label>
          <input
            className="select"
            id="attachment-id"
            name="attachable_id"
            inputMode="numeric"
            required
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="attachment-file">
            File
          </label>
          <input
            className="select"
            id="attachment-file"
            name="file"
            type="file"
            required
          />
        </div>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="attachment-notes">
          Notes
        </label>
        <textarea
          className="select"
          id="attachment-notes"
          name="notes"
          rows={2}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Uploading..." : "Create and upload attachment"}
      </Button>
      <p className="muted-note">
        Metadata and binary are created through the existing attachment API.
        Entity IDs are not guessed by the frontend.
      </p>
    </form>
  );
}
export function UpdateAttachmentForm({
  attachment,
}: {
  attachment: AttachmentRecord;
}) {
  const [state, formAction, pending] = useActionState(
    updateAttachmentAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      <input type="hidden" name="attachment_id" value={attachment.id} />
      <Messages state={state} />
      <div className="field-group">
        <label className="field-label" htmlFor="attachment-edit-title">
          Title
        </label>
        <input
          className="select"
          id="attachment-edit-title"
          name="title"
          defaultValue={attachment.title}
          required
          maxLength={255}
        />
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="attachment-edit-notes">
          Notes
        </label>
        <textarea
          className="select"
          id="attachment-edit-notes"
          name="notes"
          rows={3}
          defaultValue={attachment.notes ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save metadata"}
      </Button>
    </form>
  );
}
export function UploadAttachmentForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(
    uploadAttachmentAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      <input type="hidden" name="attachment_id" value={id} />
      <Messages state={state} />
      <div className="field-group">
        <label className="field-label" htmlFor="attachment-replace-file">
          Replace binary
        </label>
        <input
          className="select"
          id="attachment-replace-file"
          name="file"
          type="file"
          required
        />
      </div>
      <Button type="submit" tone="quiet" disabled={pending}>
        {pending ? "Uploading..." : "Upload file"}
      </Button>
    </form>
  );
}
export function DeleteAttachmentDialog({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteAttachmentAction,
    INITIAL,
  );
  return (
    <>
      <Button type="button" tone="danger" onClick={() => setOpen(true)}>
        Delete attachment
      </Button>
      <Dialog open={open} title={`Delete ${title}`} onOpenChange={setOpen}>
        <form action={formAction} className="form-stack">
          <input type="hidden" name="attachment_id" value={id} />
          <Messages state={state} />
          <p>This deletes the attachment metadata and file through Firefly.</p>
          <label className="checkbox-row">
            <input type="checkbox" name="confirm_delete" value="yes" required />
            <span>I understand this permanently deletes the attachment.</span>
          </label>
          <div className="button-row">
            <Button type="submit" tone="danger" disabled={pending}>
              {pending ? "Deleting..." : "Delete attachment"}
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
