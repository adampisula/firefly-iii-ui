"use client";

import { useActionState, useState } from "react";
import { Button, Dialog, ErrorSummary } from "@/components/ui/primitives";
import {
  AUTO_BUDGET_PERIODS,
  AUTO_BUDGET_TYPES,
  type BudgetLimit,
  type BudgetRecord,
} from "./service";
import {
  deleteBudgetAction,
  deleteLimitAction,
  saveBudgetAction,
  saveLimitAction,
  type BudgetActionState,
} from "./actions";

const INITIAL: BudgetActionState = { ok: false, message: "", errors: {} };

function Messages({ state }: { state: BudgetActionState }) {
  if (!state.message && Object.keys(state.errors).length === 0) return null;
  const errors = Object.entries(state.errors).map(([field, message]) => ({
    id: `budget-${field}`,
    message: `${field}: ${message}`,
  }));
  return (
    <ErrorSummary
      title={state.ok ? "Saved" : state.message}
      errors={
        errors.length > 0
          ? errors
          : [{ id: "budget-message", message: state.message }]
      }
    />
  );
}

export function BudgetForm({
  budget,
  currencies,
}: {
  budget?: BudgetRecord;
  currencies: readonly { code: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    saveBudgetAction,
    INITIAL,
  );
  const [autoType, setAutoType] = useState(budget?.autoBudgetType ?? "none");
  return (
    <form action={formAction} className="form-stack">
      {budget ? (
        <input type="hidden" name="budget_id" value={budget.id} />
      ) : null}
      <Messages state={state} />
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="budget-name">
            Name
          </label>
          <input
            className="select"
            id="budget-name"
            name="name"
            defaultValue={budget?.name ?? ""}
            required
            maxLength={255}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="budget-order">
            Order (whole number)
          </label>
          <input
            className="select"
            id="budget-order"
            name="order"
            inputMode="numeric"
            defaultValue={budget?.order ?? ""}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="budget-auto-type">
            Automatic budget
          </label>
          <select
            className="select"
            id="budget-auto-type"
            name="auto_budget_type"
            value={autoType}
            onChange={(event) => setAutoType(event.target.value)}
          >
            {AUTO_BUDGET_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        {autoType !== "none" ? (
          <>
            <div className="field-group">
              <label className="field-label" htmlFor="budget-auto-amount">
                Automatic amount
              </label>
              <input
                className="select"
                id="budget-auto-amount"
                name="auto_budget_amount"
                inputMode="decimal"
                defaultValue={budget?.autoBudgetAmount ?? ""}
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="budget-auto-period">
                Automatic period
              </label>
              <select
                className="select"
                id="budget-auto-period"
                name="auto_budget_period"
                defaultValue={budget?.autoBudgetPeriod ?? "monthly"}
              >
                {AUTO_BUDGET_PERIODS.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="budget-auto-currency">
                Automatic currency
              </label>
              <select
                className="select"
                id="budget-auto-currency"
                name="auto_budget_currency_code"
                defaultValue={
                  budget?.currencyCode ?? currencies[0]?.code ?? "EUR"
                }
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <input
            type="hidden"
            name="auto_budget_currency_code"
            value={currencies[0]?.code ?? "EUR"}
          />
        )}
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="budget-notes">
          Notes
        </label>
        <textarea
          className="select"
          id="budget-notes"
          name="notes"
          rows={3}
          defaultValue={budget?.notes ?? ""}
        />
      </div>
      <label className="checkbox-row">
        <input
          type="checkbox"
          name="active"
          defaultChecked={budget?.active ?? true}
        />
        <span>Active budget</span>
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : budget ? "Save budget" : "Create budget"}
      </Button>
      <p className="muted-note">
        Automatic budget values are backend configuration. Firefly applies them
        through its own cron and period processing; the frontend does not
        simulate generation.
      </p>
    </form>
  );
}

export function LimitForm({
  budgetId,
  limit,
  currencies,
  defaultCurrency,
}: {
  budgetId: string;
  limit?: BudgetLimit;
  currencies: readonly { code: string; name: string }[];
  defaultCurrency: string;
}) {
  const [state, formAction, pending] = useActionState(saveLimitAction, INITIAL);
  return (
    <form action={formAction} className="form-stack">
      <input type="hidden" name="budget_id" value={budgetId} />
      {limit ? <input type="hidden" name="limit_id" value={limit.id} /> : null}
      <Messages state={state} />
      <div className="form-grid">
        <div className="field-group">
          <label
            className="field-label"
            htmlFor={`limit-start-${limit?.id ?? "new"}`}
          >
            Start
          </label>
          <input
            className="select"
            id={`limit-start-${limit?.id ?? "new"}`}
            name="start"
            type="date"
            defaultValue={limit?.start.slice(0, 10) ?? ""}
            required
          />
        </div>
        <div className="field-group">
          <label
            className="field-label"
            htmlFor={`limit-end-${limit?.id ?? "new"}`}
          >
            End
          </label>
          <input
            className="select"
            id={`limit-end-${limit?.id ?? "new"}`}
            name="end"
            type="date"
            defaultValue={limit?.end.slice(0, 10) ?? ""}
            required
          />
        </div>
        <div className="field-group">
          <label
            className="field-label"
            htmlFor={`limit-amount-${limit?.id ?? "new"}`}
          >
            Amount
          </label>
          <input
            className="select"
            id={`limit-amount-${limit?.id ?? "new"}`}
            name="amount"
            inputMode="decimal"
            defaultValue={limit?.amount ?? ""}
            required
          />
        </div>
        <div className="field-group">
          <label
            className="field-label"
            htmlFor={`limit-currency-${limit?.id ?? "new"}`}
          >
            Currency
          </label>
          <select
            className="select"
            id={`limit-currency-${limit?.id ?? "new"}`}
            name="currency_code"
            defaultValue={limit?.currencyCode ?? defaultCurrency}
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.name} ({currency.code})
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" tone="quiet" disabled={pending}>
        {pending ? "Saving..." : limit ? "Save limit" : "Add limit"}
      </Button>
    </form>
  );
}

export function DeleteBudgetDialog({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteBudgetAction,
    INITIAL,
  );
  return (
    <>
      <Button type="button" tone="danger" onClick={() => setOpen(true)}>
        Delete budget
      </Button>
      <Dialog open={open} title={`Delete ${name}`} onOpenChange={setOpen}>
        <form action={formAction} className="form-stack">
          <input type="hidden" name="budget_id" value={id} />
          <Messages state={state} />
          <p>
            This deletes the budget and its limits through Firefly. Transactions
            are not reassigned by the frontend; review backend consequences.
          </p>
          <label className="checkbox-row">
            <input type="checkbox" name="confirm_delete" value="yes" required />
            <span>I understand this permanently deletes the budget.</span>
          </label>
          <div className="button-row">
            <Button type="submit" tone="danger" disabled={pending}>
              {pending ? "Deleting..." : "Delete budget"}
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

export function DeleteLimitDialog({
  budgetId,
  limitId,
}: {
  budgetId: string;
  limitId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteLimitAction,
    INITIAL,
  );
  return (
    <>
      <Button type="button" tone="danger" onClick={() => setOpen(true)}>
        Delete limit
      </Button>
      <Dialog
        open={open}
        title={`Delete limit ${limitId}`}
        onOpenChange={setOpen}
      >
        <form action={formAction} className="form-stack">
          <input type="hidden" name="budget_id" value={budgetId} />
          <input type="hidden" name="limit_id" value={limitId} />
          <Messages state={state} />
          <p>
            This deletes the period limit. Transactions remain in the budget.
          </p>
          <label className="checkbox-row">
            <input type="checkbox" name="confirm_delete" value="yes" required />
            <span>I understand this deletes the limit.</span>
          </label>
          <div className="button-row">
            <Button type="submit" tone="danger" disabled={pending}>
              {pending ? "Deleting..." : "Delete limit"}
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
