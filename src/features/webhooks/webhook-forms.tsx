"use client";
import { useActionState, useState } from "react";
import { Button, Dialog, ErrorSummary } from "@/components/ui/primitives";
import {
  createWebhookAction,
  deleteWebhookAction,
  submitWebhookAction,
  type WebhookActionState,
} from "./actions";
const INITIAL: WebhookActionState = { ok: false, message: "", errors: {} };
function Messages({ state }: { state: WebhookActionState }) {
  if (!state.message) return null;
  return (
    <ErrorSummary
      title={state.ok ? "Result" : state.message}
      errors={[{ id: "webhook-message", message: state.message }]}
    />
  );
}
export function CreateWebhookForm() {
  const [state, formAction, pending] = useActionState(
    createWebhookAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      <Messages state={state} />
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="webhook-title">
            Title
          </label>
          <input
            className="select"
            id="webhook-title"
            name="title"
            required
            maxLength={255}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="webhook-url">
            URL
          </label>
          <input
            className="select"
            id="webhook-url"
            name="url"
            type="url"
            required
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="webhook-trigger">
            Trigger
          </label>
          <select className="select" id="webhook-trigger" name="trigger">
            <option value="STORE_TRANSACTION">Store transaction</option>
            <option value="UPDATE_TRANSACTION">Update transaction</option>
            <option value="DESTROY_TRANSACTION">Destroy transaction</option>
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="webhook-response">
            Response
          </label>
          <select className="select" id="webhook-response" name="response">
            <option value="TRANSACTIONS">Transactions</option>
            <option value="ACCOUNTS">Accounts</option>
            <option value="BUDGET">Budget</option>
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="webhook-delivery">
            Delivery
          </label>
          <select className="select" id="webhook-delivery" name="delivery">
            <option value="JSON">JSON</option>
            <option value="FORM">Form</option>
          </select>
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create webhook"}
      </Button>
      <p className="muted-note">
        Webhook delivery is disabled unless the backend enables the feature.
        Disabled state is shown instead of a broken link.
      </p>
    </form>
  );
}
export function SubmitWebhookForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(
    submitWebhookAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      <input type="hidden" name="webhook_id" value={id} />
      <Messages state={state} />
      <label className="checkbox-row">
        <input type="checkbox" name="confirm_submit" value="yes" required />
        <span>Confirm test delivery</span>
      </label>
      <Button type="submit" tone="danger" disabled={pending}>
        {pending ? "Submitting..." : "Submit test delivery"}
      </Button>
    </form>
  );
}
export function DeleteWebhook({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteWebhookAction,
    INITIAL,
  );
  return (
    <>
      <Button type="button" tone="danger" onClick={() => setOpen(true)}>
        Delete webhook
      </Button>
      <Dialog open={open} title={`Delete ${title}`} onOpenChange={setOpen}>
        <form action={formAction} className="form-stack">
          <input type="hidden" name="webhook_id" value={id} />
          <Messages state={state} />
          <p>
            This deletes the webhook and its delivery history through Firefly.
          </p>
          <label className="checkbox-row">
            <input type="checkbox" name="confirm_delete" value="yes" required />
            <span>I understand this permanently deletes the webhook.</span>
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
export function SecretReveal({ secret }: { secret: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="field-group">
      <span className="field-label">Webhook secret</span>
      <code>{shown ? secret : "••••••••"}</code>
      <Button
        type="button"
        tone="quiet"
        onClick={() => setShown((value) => !value)}
      >
        {shown ? "Hide secret" : "Reveal secret"}
      </Button>
      <p className="muted-note">
        Regenerating the secret has no verified dedicated API; edit the webhook
        in the native backend if needed.
      </p>
    </div>
  );
}
