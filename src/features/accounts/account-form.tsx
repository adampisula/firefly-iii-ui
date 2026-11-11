"use client";

import { useActionState, useState } from "react";
import {
  Button,
  CurrencyField,
  DateField,
  ErrorSummary,
  TextField,
} from "@/components/ui/primitives";
import {
  ASSET_ROLES,
  ACCOUNT_TYPES,
  INTEREST_PERIODS,
  LIABILITY_DIRECTIONS,
  LIABILITY_TYPES,
  type AccountRecord,
} from "./service";
import {
  createAccountAction,
  updateAccountAction,
  type AccountActionState,
} from "./actions";

const INITIAL: AccountActionState = { ok: false, message: "", errors: {} };

function ErrorList({ state }: { state: AccountActionState }) {
  if (state.message === "" && Object.keys(state.errors).length === 0)
    return null;
  const entries = Object.entries(state.errors);
  return (
    <ErrorSummary
      title={state.message || "Check the account fields"}
      errors={
        entries.length > 0
          ? entries.map(([field, message]) => ({
              id: `account-field-${field.replaceAll(".", "-")}`,
              message: `${field}: ${message}`,
            }))
          : [{ id: "account-action", message: state.message }]
      }
    />
  );
}

export function AccountForm({
  mode,
  account,
  currencies,
}: {
  mode: "create" | "edit";
  account?: AccountRecord;
  currencies: readonly { code: string; name: string }[];
}) {
  const action = mode === "create" ? createAccountAction : updateAccountAction;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const [type, setType] = useState(account?.type ?? "asset");
  const [role, setRole] = useState(account?.role ?? "defaultAsset");

  return (
    <form action={formAction} className="form-stack">
      {account ? (
        <input type="hidden" name="account_id" value={account.id} />
      ) : null}
      <ErrorList state={state} />

      <div className="form-grid">
        <TextField
          id="name"
          name="name"
          label="Account name"
          defaultValue={account?.name ?? ""}
          required
          error={state.errors.name}
        />
        <div className="field-group">
          <label className="field-label" htmlFor="type">
            Account type
          </label>
          <select
            className="select"
            id="type"
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            disabled={mode === "edit"}
          >
            {ACCOUNT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          {mode === "edit" ? (
            <p className="muted-note">
              Firefly does not support changing an account type in place.
            </p>
          ) : null}
        </div>
        {type === "asset" ? (
          <div className="field-group">
            <label className="field-label" htmlFor="account_role">
              Asset role
            </label>
            <select
              className="select"
              id="account_role"
              name="account_role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {ASSET_ROLES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <CurrencyField
          id="currency_code"
          name="currency_code"
          label="Currency"
          value={account?.currencyCode}
          currencies={currencies}
          disabled={mode === "edit"}
        />
      </div>

      {type === "asset" && role === "ccAsset" ? (
        <fieldset className="field-group">
          <legend className="field-label">Credit-card fields</legend>
          <div className="form-grid">
            <div className="field-group">
              <label className="field-label" htmlFor="credit_card_type">
                Payment type
              </label>
              <select
                className="select"
                id="credit_card_type"
                name="credit_card_type"
                defaultValue={account?.creditCardType ?? "monthlyFull"}
              >
                <option value="monthlyFull">Full payment every month</option>
              </select>
            </div>
            <DateField
              id="monthly_payment_date"
              name="monthly_payment_date"
              label="Monthly payment date"
              value={account?.monthlyPaymentDate ?? ""}
              required
            />
          </div>
          <p className="muted-note">
            These are bookkeeping fields. The frontend never issues card
            payments or controls a bank-issued card.
          </p>
        </fieldset>
      ) : null}

      {type === "liability" ? (
        <fieldset className="field-group">
          <legend className="field-label">Liability fields</legend>
          <div className="form-grid">
            <div className="field-group">
              <label className="field-label" htmlFor="liability_type">
                Liability type
              </label>
              <select
                className="select"
                id="liability_type"
                name="liability_type"
                defaultValue={account?.liabilityType ?? "loan"}
              >
                {LIABILITY_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="liability_direction">
                Direction
              </label>
              <select
                className="select"
                id="liability_direction"
                name="liability_direction"
                defaultValue={account?.liabilityDirection ?? "debit"}
              >
                {LIABILITY_DIRECTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <TextField
              id="interest"
              name="interest"
              label="Interest rate (%)"
              type="text"
              defaultValue={account?.interest ?? "0"}
              required
            />
            <div className="field-group">
              <label className="field-label" htmlFor="interest_period">
                Interest period
              </label>
              <select
                className="select"
                id="interest_period"
                name="interest_period"
                defaultValue={account?.interestPeriod ?? "monthly"}
              >
                {INTEREST_PERIODS.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>
            <TextField
              id="liability_amount"
              name="liability_amount"
              label="Liability amount"
              defaultValue={account?.liabilityAmount ?? ""}
              hint="Provide together with the start date, or leave both empty."
            />
            <DateField
              id="liability_start_date"
              name="liability_start_date"
              label="Liability start date"
              value={account?.liabilityStartDate ?? ""}
            />
          </div>
        </fieldset>
      ) : null}

      <fieldset className="field-group">
        <legend className="field-label">Balances and identifiers</legend>
        <div className="form-grid">
          <TextField
            id="opening_balance"
            name="opening_balance"
            label="Opening balance"
            defaultValue={account?.openingBalance ?? ""}
            hint="Decimal amount. Pair with the opening balance date."
          />
          <DateField
            id="opening_balance_date"
            name="opening_balance_date"
            label="Opening balance date"
            value={account?.openingBalanceDate ?? ""}
          />
          <TextField
            id="virtual_balance"
            name="virtual_balance"
            label="Virtual balance"
            defaultValue={account?.virtualBalance ?? ""}
          />
          <TextField
            id="iban"
            name="iban"
            label="IBAN"
            defaultValue={account?.iban ?? ""}
          />
          <TextField
            id="bic"
            name="bic"
            label="BIC"
            defaultValue={account?.bic ?? ""}
          />
          <TextField
            id="account_number"
            name="account_number"
            label="Account number"
            defaultValue={account?.accountNumber ?? ""}
          />
        </div>
      </fieldset>

      <div className="field-group">
        <label className="field-label" htmlFor="notes">
          Notes
        </label>
        <textarea
          className="select"
          id="notes"
          name="notes"
          rows={4}
          defaultValue={account?.notes ?? ""}
        />
      </div>

      <div className="checkbox-grid">
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="active"
            defaultChecked={account?.active ?? true}
          />
          <span>Active account</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="include_net_worth"
            defaultChecked={account?.includeNetWorth ?? true}
          />
          <span>Include in net worth</span>
        </label>
      </div>

      <div className="button-row">
        <Button type="submit" disabled={pending}>
          {pending
            ? mode === "create"
              ? "Creating account..."
              : "Saving account..."
            : mode === "create"
              ? "Create account"
              : "Save account"}
        </Button>
      </div>
    </form>
  );
}
