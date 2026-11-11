"use client";
import { useActionState, useState } from "react";
import { Button, Dialog, ErrorSummary } from "@/components/ui/primitives";
import type { CurrencyRecord, ExchangeRateRecord } from "./service";
import {
  currencyToggleAction,
  deleteCurrencyAction,
  deleteRateAction,
  saveCurrencyAction,
  saveRateAction,
  type CurrencyActionState,
} from "./actions";
const INITIAL: CurrencyActionState = { ok: false, message: "", errors: {} };
function Messages({ state }: { state: CurrencyActionState }) {
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
export function CurrencyForm({ currency }: { currency?: CurrencyRecord }) {
  const [state, formAction, pending] = useActionState(
    saveCurrencyAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      {currency ? (
        <input type="hidden" name="original_code" value={currency.code} />
      ) : null}
      <Messages state={state} />
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="currency-name">
            Name
          </label>
          <input
            className="select"
            id="currency-name"
            name="name"
            defaultValue={currency?.name ?? ""}
            required
            maxLength={255}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="currency-code">
            Code
          </label>
          <input
            className="select"
            id="currency-code"
            name="code"
            defaultValue={currency?.code ?? ""}
            required
            maxLength={32}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="currency-symbol">
            Symbol
          </label>
          <input
            className="select"
            id="currency-symbol"
            name="symbol"
            defaultValue={currency?.symbol ?? ""}
            required
            maxLength={32}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="currency-decimals">
            Decimal places (0–12)
          </label>
          <input
            className="select"
            id="currency-decimals"
            name="decimal_places"
            inputMode="numeric"
            defaultValue={currency?.decimalPlaces ?? 2}
            required
          />
        </div>
      </div>
      <div className="checkbox-grid">
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={currency?.enabled ?? true}
          />
          <span>Enabled</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="default"
            defaultChecked={currency?.default ?? false}
          />
          <span>Default currency</span>
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : currency ? "Save currency" : "Create currency"}
      </Button>
      <p className="muted-note">
        Codes and symbols must be unique. Non-owner metadata updates may be
        backend-restricted.
      </p>
    </form>
  );
}
export function CurrencyActions({ currency }: { currency: CurrencyRecord }) {
  const [state, formAction, pending] = useActionState(
    currencyToggleAction,
    INITIAL,
  );
  return (
    <div className="form-stack">
      <Messages state={state} />
      <div className="button-row">
        {["enable", "disable", "primary"].map((action) => (
          <form key={action} action={formAction} className="inline-form">
            <input type="hidden" name="code" value={currency.code} />
            <input type="hidden" name="action" value={action} />
            <Button type="submit" tone="quiet" disabled={pending}>
              {pending
                ? "Working..."
                : action === "primary"
                  ? "Make primary"
                  : action === "enable"
                    ? "Enable"
                    : "Disable"}
            </Button>
          </form>
        ))}
      </div>
      <p className="muted-note">
        Disabling an in-use currency is rejected by Firefly (409). Primary
        changes affect conversion/display, not the stored amounts.
      </p>
    </div>
  );
}
export function DeleteCurrency({ currency }: { currency: CurrencyRecord }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteCurrencyAction,
    INITIAL,
  );
  return (
    <>
      <Button type="button" tone="danger" onClick={() => setOpen(true)}>
        Delete currency
      </Button>
      <Dialog
        open={open}
        title={`Delete ${currency.code}`}
        onOpenChange={setOpen}
      >
        <form action={formAction} className="form-stack">
          <input type="hidden" name="code" value={currency.code} />
          <Messages state={state} />
          <p>
            Deletion is rejected when the currency is in use. No amounts are
            relabeled.
          </p>
          <label className="checkbox-row">
            <input type="checkbox" name="confirm_delete" value="yes" required />
            <span>I understand this permanently deletes the currency.</span>
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
export function RateForm() {
  const [state, formAction, pending] = useActionState(saveRateAction, INITIAL);
  return (
    <form action={formAction} className="form-stack">
      <Messages state={state} />
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="rate-from">
            From
          </label>
          <input
            className="select"
            id="rate-from"
            name="from"
            required
            maxLength={3}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="rate-to">
            To
          </label>
          <input
            className="select"
            id="rate-to"
            name="to"
            required
            maxLength={3}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="rate-date">
            Date
          </label>
          <input
            className="select"
            id="rate-date"
            name="date"
            type="date"
            required
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="rate-value">
            Rate
          </label>
          <input
            className="select"
            id="rate-value"
            name="rate"
            inputMode="decimal"
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save exchange rate"}
      </Button>
      <p className="muted-note">
        Rates are stored for the exact pair/date. Inverse presentation is
        explanatory only; stored amounts are never relabeled.
      </p>
    </form>
  );
}
export function DeleteRate({ rate }: { rate: ExchangeRateRecord }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteRateAction,
    INITIAL,
  );
  return (
    <>
      <Button type="button" tone="danger" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <Dialog
        open={open}
        title={`Delete ${rate.from}/${rate.to} ${rate.date ?? ""}`}
        onOpenChange={setOpen}
      >
        <form action={formAction} className="form-stack">
          <input type="hidden" name="from" value={rate.from} />
          <input type="hidden" name="to" value={rate.to} />
          <input
            type="hidden"
            name="date"
            value={rate.date?.slice(0, 10) ?? ""}
          />
          <Messages state={state} />
          <label className="checkbox-row">
            <input type="checkbox" name="confirm_delete" value="yes" required />
            <span>Confirm deleting this dated rate.</span>
          </label>
          <div className="button-row">
            <Button type="submit" tone="danger" disabled={pending}>
              {pending ? "Deleting..." : "Delete rate"}
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
