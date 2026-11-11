"use client";
import { useActionState, useState } from "react";
import { Button, Dialog, ErrorSummary } from "@/components/ui/primitives";
import {
  deleteUserAction,
  saveConfigAction,
  saveUserAction,
  type UserAdminState,
} from "./actions";
import type { UserRecord } from "./service";
const INITIAL: UserAdminState = { ok: false, message: "" };
function Message({ state }: { state: UserAdminState }) {
  return state.message ? (
    <ErrorSummary
      title={state.ok ? "Saved" : "Blocked"}
      errors={[{ id: "user-admin", message: state.message }]}
    />
  ) : null;
}
export function UserForm({ user }: { user?: UserRecord }) {
  const [state, formAction, pending] = useActionState(saveUserAction, INITIAL);
  return (
    <form action={formAction} className="form-stack">
      {user ? <input type="hidden" name="user_id" value={user.id} /> : null}
      <Message state={state} />
      <div className="form-grid">
        <div className="field-group">
          <label
            className="field-label"
            htmlFor={`user-email-${user?.id ?? "new"}`}
          >
            Email
          </label>
          <input
            className="select"
            id={`user-email-${user?.id ?? "new"}`}
            name="email"
            type="email"
            defaultValue={user?.email ?? ""}
            required
          />
        </div>
        <div className="field-group">
          <label
            className="field-label"
            htmlFor={`user-role-${user?.id ?? "new"}`}
          >
            Role
          </label>
          <select
            className="select"
            id={`user-role-${user?.id ?? "new"}`}
            name="role"
            defaultValue={user?.role ?? "member"}
          >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="demo">Demo</option>
          </select>
        </div>
        <div className="field-group">
          <label
            className="field-label"
            htmlFor={`user-blocked-${user?.id ?? "new"}`}
          >
            Blocked
          </label>
          <select
            className="select"
            id={`user-blocked-${user?.id ?? "new"}`}
            name="blocked"
            defaultValue={String(user?.blocked ?? false)}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
      </div>
      <Button type="submit" tone="quiet" disabled={pending}>
        {pending ? "Saving..." : user ? "Save user" : "Create user"}
      </Button>
      <p className="muted-note">
        Owners can manage users. Invitation email and update checks have no API
        and remain residual.
      </p>
    </form>
  );
}
export function DeleteUser({ user }: { user: UserRecord }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteUserAction,
    INITIAL,
  );
  return (
    <>
      <Button type="button" tone="danger" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <Dialog open={open} title={`Delete ${user.email}`} onOpenChange={setOpen}>
        <form action={formAction} className="form-stack">
          <input type="hidden" name="user_id" value={user.id} />
          <Message state={state} />
          <label className="checkbox-row">
            <input type="checkbox" name="confirm_delete" value="yes" required />
            <span>Confirm permanent user deletion.</span>
          </label>
          <div className="button-row">
            <Button type="submit" tone="danger" disabled={pending}>
              {pending ? "Deleting..." : "Delete user"}
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
export function ConfigForm() {
  const [state, formAction, pending] = useActionState(
    saveConfigAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      <Message state={state} />
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="config-key">
            Configuration key
          </label>
          <input className="select" id="config-key" name="key" required />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="config-value">
            Value
          </label>
          <input className="select" id="config-value" name="value" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save configuration"}
      </Button>
      <p className="muted-note">
        Only existing keys are accepted by the backend. Secrets must not be
        entered here.
      </p>
    </form>
  );
}
