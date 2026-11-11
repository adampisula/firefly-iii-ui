"use client";
import { useActionState, useState } from "react";
import { Button, Dialog, ErrorSummary } from "@/components/ui/primitives";
import type { RecurrenceRecord } from "./service";
import {
  deleteRecurrenceAction,
  saveRecurrenceAction,
  triggerRecurrenceAction,
  type RecurrenceActionState,
} from "./actions";

const INITIAL: RecurrenceActionState = { ok: false, message: "", errors: {} };
function Messages({ state }: { state: RecurrenceActionState }) {
  if (!state.message && Object.keys(state.errors).length === 0) return null;
  return (
    <ErrorSummary
      title={state.ok ? "Result" : state.message}
      errors={Object.entries(state.errors).map(([field, message]) => ({
        id: field,
        message: `${field}: ${message}`,
      }))}
    />
  );
}
export function RecurrenceForm({
  recurrence,
  accounts,
  currencies,
}: {
  recurrence?: RecurrenceRecord;
  accounts: readonly { id: string; name: string; type: string }[];
  currencies: readonly { code: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    saveRecurrenceAction,
    INITIAL,
  );
  const tx = recurrence?.transactions[0];
  const rep = recurrence?.repetitions[0];
  return (
    <form action={formAction} className="form-stack">
      {recurrence ? (
        <input type="hidden" name="recurrence_id" value={recurrence.id} />
      ) : null}
      <Messages state={state} />
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="rec-type">
            Type
          </label>
          <select
            className="select"
            id="rec-type"
            name="type"
            defaultValue={recurrence?.type ?? "withdrawal"}
          >
            <option value="withdrawal">Withdrawal</option>
            <option value="deposit">Deposit</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="rec-title">
            Title
          </label>
          <input
            className="select"
            id="rec-title"
            name="title"
            defaultValue={recurrence?.title ?? ""}
            required
            maxLength={255}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="rec-first">
            First date
          </label>
          <input
            className="select"
            id="rec-first"
            name="first_date"
            type="date"
            defaultValue={recurrence?.firstDate.slice(0, 10) ?? ""}
            required
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="rec-until">
            Repeat until (optional)
          </label>
          <input
            className="select"
            id="rec-until"
            name="repeat_until"
            type="date"
            defaultValue={recurrence?.repeatUntil?.slice(0, 10) ?? ""}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="rec-count">
            Repetitions (optional)
          </label>
          <input
            className="select"
            id="rec-count"
            name="nr_of_repetitions"
            inputMode="numeric"
            defaultValue={recurrence?.nrOfRepetitions ?? ""}
          />
        </div>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="rec-description">
          Description
        </label>
        <textarea
          className="select"
          id="rec-description"
          name="description"
          rows={2}
          defaultValue={recurrence?.description ?? ""}
        />
      </div>
      <fieldset className="panel">
        <legend>Repetition</legend>
        <div className="form-grid">
          <div className="field-group">
            <label className="field-label" htmlFor="rec-rep-type">
              Frequency
            </label>
            <select
              className="select"
              id="rec-rep-type"
              name="rep_type"
              defaultValue={rep?.type ?? "monthly"}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="ndom">Nth day of month</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="rec-rep-moment">
              Moment
            </label>
            <input
              className="select"
              id="rec-rep-moment"
              name="rep_moment"
              defaultValue={rep?.moment ?? ""}
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="rec-rep-skip">
              Skip
            </label>
            <input
              className="select"
              id="rec-rep-skip"
              name="rep_skip"
              inputMode="numeric"
              defaultValue={rep?.skip ?? 0}
            />
          </div>
        </div>
      </fieldset>
      <fieldset className="panel">
        <legend>Transaction template</legend>
        <div className="field-group">
          <label className="field-label" htmlFor="rec-tx-description">
            Description
          </label>
          <input
            className="select"
            id="rec-tx-description"
            name="tx_description"
            defaultValue={tx?.description ?? ""}
            required
            maxLength={255}
          />
        </div>
        <div className="form-grid">
          <div className="field-group">
            <label className="field-label" htmlFor="rec-tx-amount">
              Amount
            </label>
            <input
              className="select"
              id="rec-tx-amount"
              name="tx_amount"
              inputMode="decimal"
              defaultValue={tx?.amount ?? ""}
              required
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="rec-tx-source">
              Source
            </label>
            <select
              className="select"
              id="rec-tx-source"
              name="tx_source_id"
              defaultValue={tx?.sourceId ?? ""}
              required
            >
              <option value="">Choose</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="rec-tx-destination">
              Destination
            </label>
            <select
              className="select"
              id="rec-tx-destination"
              name="tx_destination_id"
              defaultValue={tx?.destinationId ?? ""}
              required
            >
              <option value="">Choose</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="rec-tx-currency">
              Currency
            </label>
            <select
              className="select"
              id="rec-tx-currency"
              name="tx_currency_code"
              defaultValue={tx?.currencyCode ?? currencies[0]?.code ?? "EUR"}
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.name} ({currency.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>
      <div className="checkbox-grid">
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="active"
            defaultChecked={recurrence?.active ?? true}
          />
          <span>Active</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="apply_rules"
            defaultChecked={recurrence?.applyRules ?? true}
          />
          <span>Apply rules</span>
        </label>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="rec-notes">
          Notes
        </label>
        <textarea
          className="select"
          id="rec-notes"
          name="notes"
          rows={2}
          defaultValue={recurrence?.notes ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending
          ? "Saving..."
          : recurrence
            ? "Save recurrence"
            : "Create recurrence"}
      </Button>
      <p className="muted-note">
        One repetition and one transaction template are supported in this slice.
        Schedule suggestions and calendar preview remain unsupported.
      </p>
    </form>
  );
}
export function TriggerRecurrenceForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(
    triggerRecurrenceAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      <input type="hidden" name="recurrence_id" value={id} />
      <Messages state={state} />
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="trigger-date">
            Execution date
          </label>
          <input
            className="select"
            id="trigger-date"
            name="date"
            type="date"
            required
          />
        </div>
        <label className="checkbox-row">
          <input type="checkbox" name="confirm_trigger" value="yes" required />
          <span>Confirm execution</span>
        </label>
      </div>
      <Button type="submit" tone="danger" disabled={pending}>
        {pending ? "Executing..." : "Trigger recurrence"}
      </Button>
      <p className="muted-note">
        Creates the expected transaction for that date. This changes financial
        data.
      </p>
    </form>
  );
}
export function DeleteRecurrence({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteRecurrenceAction,
    INITIAL,
  );
  return (
    <>
      <Button type="button" tone="danger" onClick={() => setOpen(true)}>
        Delete recurrence
      </Button>
      <Dialog open={open} title={`Delete ${title}`} onOpenChange={setOpen}>
        <form action={formAction} className="form-stack">
          <input type="hidden" name="recurrence_id" value={id} />
          <Messages state={state} />
          <p>
            This deletes the recurrence template. Existing generated
            transactions remain.
          </p>
          <label className="checkbox-row">
            <input type="checkbox" name="confirm_delete" value="yes" required />
            <span>I understand this permanently deletes the recurrence.</span>
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
