"use client";

import { useActionState, useState } from "react";
import { Button, Dialog, ErrorSummary } from "@/components/ui/primitives";
import { REPEAT_FREQUENCIES, type BillRecord } from "./service";
import {
  deleteBillAction,
  saveBillAction,
  type BillActionState,
} from "./actions";
import { DateInput } from "@/components/ui/date-field";

const INITIAL: BillActionState = { ok: false, message: "", errors: {} };

function Messages({ state }: { state: BillActionState }) {
  if (!state.message && Object.keys(state.errors).length === 0) return null;
  const errors = Object.entries(state.errors).map(([field, message]) => ({
    id: `bill-${field}`,
    message: `${field}: ${message}`,
  }));
  return (
    <ErrorSummary
      title={state.ok ? "Saved" : state.message}
      errors={
        errors.length > 0
          ? errors
          : [{ id: "bill-message", message: state.message }]
      }
    />
  );
}

export function BillForm({
  bill,
  currencies,
}: {
  bill?: BillRecord;
  currencies: readonly { code: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(saveBillAction, INITIAL);
  return (
    <form action={formAction} className="form-stack">
      {bill ? <input type="hidden" name="bill_id" value={bill.id} /> : null}
      <Messages state={state} />
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="bill-name">
            Name
          </label>
          <input
            className="select"
            id="bill-name"
            name="name"
            defaultValue={bill?.name ?? ""}
            required
            maxLength={255}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="bill-min">
            Minimum amount
          </label>
          <input
            className="select"
            id="bill-min"
            name="amount_min"
            inputMode="decimal"
            defaultValue={bill?.amountMin ?? ""}
            required
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="bill-max">
            Maximum amount
          </label>
          <input
            className="select"
            id="bill-max"
            name="amount_max"
            inputMode="decimal"
            defaultValue={bill?.amountMax ?? ""}
            required
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="bill-currency">
            Currency
          </label>
          <select
            className="select"
            id="bill-currency"
            name="currency_code"
            defaultValue={bill?.currencyCode ?? currencies[0]?.code ?? "EUR"}
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.name} ({currency.code})
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="bill-date">
            First date
          </label>
          <DateInput
            id="bill-date"
            name="date"
            defaultValue={bill?.date.slice(0, 10) ?? ""}
            required
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="bill-freq">
            Frequency
          </label>
          <select
            className="select"
            id="bill-freq"
            name="repeat_freq"
            defaultValue={bill?.repeatFreq ?? "monthly"}
          >
            {REPEAT_FREQUENCIES.map((frequency) => (
              <option key={frequency} value={frequency}>
                {frequency}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="bill-skip">
            Skip count
          </label>
          <input
            className="select"
            id="bill-skip"
            name="skip"
            inputMode="numeric"
            defaultValue={bill?.skip ?? 0}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="bill-group">
            Object group title
          </label>
          <input
            className="select"
            id="bill-group"
            name="object_group_title"
            defaultValue={bill?.objectGroupTitle ?? ""}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="bill-end">
            End date (optional)
          </label>
          <DateInput
            id="bill-end"
            name="end_date"
            defaultValue={bill?.endDate?.slice(0, 10) ?? ""}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="bill-extension">
            Extension date (optional)
          </label>
          <DateInput
            id="bill-extension"
            name="extension_date"
            defaultValue={bill?.extensionDate?.slice(0, 10) ?? ""}
          />
        </div>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="bill-notes">
          Notes
        </label>
        <textarea
          className="select"
          id="bill-notes"
          name="notes"
          rows={3}
          defaultValue={bill?.notes ?? ""}
        />
      </div>
      <label className="checkbox-row">
        <input
          type="checkbox"
          name="active"
          defaultChecked={bill?.active ?? true}
        />
        <span>Active subscription</span>
      </label>
      <Button type="submit" disabled={pending}>
        {pending
          ? "Saving..."
          : bill
            ? "Save subscription"
            : "Create subscription"}
      </Button>
      <p className="muted-note">
        Subscriptions describe expected payments; they do not execute bill
        payments. Object-group titles use supported resource semantics.
      </p>
    </form>
  );
}

export function DeleteBillDialog({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteBillAction,
    INITIAL,
  );
  return (
    <>
      <Button type="button" tone="danger" onClick={() => setOpen(true)}>
        Delete subscription
      </Button>
      <Dialog open={open} title={`Delete ${name}`} onOpenChange={setOpen}>
        <form action={formAction} className="form-stack">
          <input type="hidden" name="bill_id" value={id} />
          <Messages state={state} />
          <p>
            This deletes the subscription through Firefly. Transactions and
            matching rules are not reassigned by the frontend.
          </p>
          <label className="checkbox-row">
            <input type="checkbox" name="confirm_delete" value="yes" required />
            <span>I understand this permanently deletes the subscription.</span>
          </label>
          <div className="button-row">
            <Button type="submit" tone="danger" disabled={pending}>
              {pending ? "Deleting..." : "Delete subscription"}
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
