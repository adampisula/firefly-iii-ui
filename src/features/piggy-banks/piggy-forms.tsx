"use client";
import { useActionState, useState } from "react";
import { Button, Dialog, ErrorSummary } from "@/components/ui/primitives";
import type { PiggyBankRecord } from "./service";
import {
  deletePiggyAction,
  savePiggyAction,
  type PiggyActionState,
} from "./actions";

const INITIAL: PiggyActionState = { ok: false, message: "", errors: {} };
function Messages({ state }: { state: PiggyActionState }) {
  if (!state.message && Object.keys(state.errors).length === 0) return null;
  const errors = Object.entries(state.errors).map(([field, message]) => ({
    id: `piggy-${field}`,
    message: `${field}: ${message}`,
  }));
  return (
    <ErrorSummary
      title={state.ok ? "Saved" : state.message}
      errors={
        errors.length
          ? errors
          : [{ id: "piggy-message", message: state.message }]
      }
    />
  );
}
export function PiggyForm({
  piggy,
  accounts,
  currencies = [],
}: {
  piggy?: PiggyBankRecord;
  accounts: readonly { id: string; name: string; type: string }[];
  currencies?: readonly { code: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(savePiggyAction, INITIAL);
  const primary = piggy?.accounts[0];
  return (
    <form action={formAction} className="form-stack">
      {piggy ? <input type="hidden" name="piggy_id" value={piggy.id} /> : null}
      <Messages state={state} />
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="piggy-name">
            Name
          </label>
          <input
            className="select"
            id="piggy-name"
            name="name"
            defaultValue={piggy?.name ?? ""}
            required
            maxLength={255}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="piggy-target">
            Target amount
          </label>
          <input
            className="select"
            id="piggy-target"
            name="target_amount"
            inputMode="decimal"
            defaultValue={piggy?.targetAmount ?? ""}
            required
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="piggy-start">
            Start date
          </label>
          <input
            className="select"
            id="piggy-start"
            name="start_date"
            type="date"
            defaultValue={piggy?.startDate?.slice(0, 10) ?? ""}
            required
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="piggy-end">
            Target date (optional)
          </label>
          <input
            className="select"
            id="piggy-end"
            name="target_date"
            type="date"
            defaultValue={piggy?.targetDate?.slice(0, 10) ?? ""}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="piggy-order">
            Order
          </label>
          <input
            className="select"
            id="piggy-order"
            name="order"
            inputMode="numeric"
            defaultValue={piggy?.order ?? ""}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="piggy-group">
            Object group title
          </label>
          <input
            className="select"
            id="piggy-group"
            name="object_group_title"
            defaultValue={piggy?.objectGroupTitle ?? ""}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="piggy-account">
            Reserved account
          </label>
          <select
            className="select"
            id="piggy-account"
            name="account_id"
            defaultValue={primary?.accountId ?? accounts[0]?.id ?? ""}
            required
          >
            <option value="">Choose asset account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.type})
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="piggy-current">
            Reserved amount
          </label>
          <input
            className="select"
            id="piggy-current"
            name="current_amount"
            inputMode="decimal"
            defaultValue={primary?.currentAmount ?? "0"}
            required
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="piggy-currency">
            Currency
          </label>
          <select
            className="select"
            id="piggy-currency"
            name="currency_code"
            defaultValue={primary?.currencyCode ?? currencies[0]?.code ?? "EUR"}
          >
            {(currencies.length > 0
              ? currencies
              : [{ code: "EUR", name: "Euro" }]
            ).map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.name} ({currency.code})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="piggy-notes">
          Notes
        </label>
        <textarea
          className="select"
          id="piggy-notes"
          name="notes"
          rows={3}
          defaultValue={piggy?.notes ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending
          ? "Saving..."
          : piggy
            ? "Save savings goal"
            : "Create savings goal"}
      </Button>
      <p className="muted-note">
        Reserved amounts are bookkeeping allocations, not real bank transfers.
        Existing extra account allocations are preserved on edit.
      </p>
    </form>
  );
}
export function DeletePiggyDialog({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deletePiggyAction,
    INITIAL,
  );
  return (
    <>
      <Button type="button" tone="danger" onClick={() => setOpen(true)}>
        Delete savings goal
      </Button>
      <Dialog open={open} title={`Delete ${name}`} onOpenChange={setOpen}>
        <form action={formAction} className="form-stack">
          <input type="hidden" name="piggy_id" value={id} />
          <Messages state={state} />
          <p>
            This deletes the savings goal through Firefly. Account balances and
            event history are backend-owned.
          </p>
          <label className="checkbox-row">
            <input type="checkbox" name="confirm_delete" value="yes" required />
            <span>I understand this permanently deletes the savings goal.</span>
          </label>
          <div className="button-row">
            <Button type="submit" tone="danger" disabled={pending}>
              {pending ? "Deleting..." : "Delete savings goal"}
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
