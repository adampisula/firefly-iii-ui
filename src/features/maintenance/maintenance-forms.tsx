"use client";
import { useActionState } from "react";
import { Button, ErrorSummary } from "@/components/ui/primitives";
import {
  destroyDataAction,
  purgeDataAction,
  type MaintenanceState,
} from "./actions";
const INITIAL: MaintenanceState = { ok: false, message: "" };
function Message({ state }: { state: MaintenanceState }) {
  return state.message ? (
    <ErrorSummary
      title={state.ok ? "Result" : "Blocked"}
      errors={[{ id: "maintenance", message: state.message }]}
    />
  ) : null;
}
export function DestroyForm() {
  const [state, formAction, pending] = useActionState(
    destroyDataAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      <Message state={state} />
      <div className="field-group">
        <label className="field-label" htmlFor="destroy-objects">
          Data family
        </label>
        <select className="select" id="destroy-objects" name="objects">
          <option value="">Choose family</option>
          <option value="budgets">Budgets</option>
          <option value="bills">Subscriptions/bills</option>
          <option value="piggy_banks">Piggy banks</option>
          <option value="rules">Rules</option>
          <option value="recurring">Recurrences</option>
          <option value="categories">Categories</option>
          <option value="tags">Tags</option>
          <option value="object_groups">Object groups</option>
        </select>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="destroy-unused">
          Unused only
        </label>
        <select className="select" id="destroy-unused" name="unused">
          <option value="false">No — delete all in family</option>
          <option value="true">Yes — unused only</option>
        </select>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="destroy-confirm">
          Type DELETE
        </label>
        <input
          className="select"
          id="destroy-confirm"
          name="confirm"
          required
        />
      </div>
      <Button type="submit" tone="danger" disabled={pending}>
        {pending ? "Deleting..." : "Delete data family"}
      </Button>
      <p className="muted-note">
        This is irreversible. Transactions are not reassigned by the frontend.
      </p>
    </form>
  );
}
export function PurgeForm() {
  const [state, formAction, pending] = useActionState(purgeDataAction, INITIAL);
  return (
    <form action={formAction} className="form-stack">
      <Message state={state} />
      <div className="field-group">
        <label className="field-label" htmlFor="purge-confirm">
          Type PURGE
        </label>
        <input className="select" id="purge-confirm" name="confirm" required />
      </div>
      <Button type="submit" tone="danger" disabled={pending}>
        {pending ? "Purging..." : "Permanently purge soft-deleted records"}
      </Button>
    </form>
  );
}
