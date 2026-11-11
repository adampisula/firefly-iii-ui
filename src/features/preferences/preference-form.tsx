"use client";
import { useActionState } from "react";
import { Button, ErrorSummary } from "@/components/ui/primitives";
import { savePreferencesAction, type PreferenceActionState } from "./actions";
const INITIAL: PreferenceActionState = { ok: false, message: "", errors: {} };
export interface PreferenceDefaults {
  locale: string;
  listPageSize: string;
  viewRange: string;
  convert: boolean;
  customFiscalYear: boolean;
  fiscalYearStart: string;
  frontpageAccounts: string[];
  optionalFields: Record<string, boolean>;
}
export function PreferenceForm({
  defaults,
  accounts,
}: {
  defaults: PreferenceDefaults;
  accounts: readonly { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    savePreferencesAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      {state.message ? (
        <ErrorSummary
          title={state.ok ? "Saved" : state.message}
          errors={[{ id: "pref", message: state.message }]}
        />
      ) : null}
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="pref-locale">
            Formatting locale
          </label>
          <input
            className="select"
            id="pref-locale"
            name="locale"
            defaultValue={defaults.locale}
          />
          <p className="muted-note">
            English-only UI. Use “equal” to follow the backend language where
            supported.
          </p>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="pref-page-size">
            List page size
          </label>
          <input
            className="select"
            id="pref-page-size"
            name="listPageSize"
            inputMode="numeric"
            defaultValue={defaults.listPageSize}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="pref-view-range">
            Date view range
          </label>
          <select
            className="select"
            id="pref-view-range"
            name="viewRange"
            defaultValue={defaults.viewRange}
          >
            <option value="1m">1 month</option>
            <option value="3m">3 months</option>
            <option value="6m">6 months</option>
            <option value="1y">1 year</option>
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="pref-fiscal-start">
            Fiscal year start
          </label>
          <input
            className="select"
            id="pref-fiscal-start"
            name="fiscalYearStart"
            placeholder="MM-DD"
            defaultValue={defaults.fiscalYearStart}
          />
        </div>
      </div>
      <div className="checkbox-grid">
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="convert_to_primary"
            defaultChecked={defaults.convert}
          />
          <span>Convert amounts to primary currency</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="customFiscalYear"
            defaultChecked={defaults.customFiscalYear}
          />
          <span>Custom fiscal year</span>
        </label>
      </div>
      <fieldset className="field-group">
        <legend className="field-label">Dashboard accounts</legend>
        <div className="checkbox-grid">
          {accounts.map((account) => (
            <label className="checkbox-row" key={account.id}>
              <input
                type="checkbox"
                name="frontpageAccounts"
                value={account.id}
                defaultChecked={defaults.frontpageAccounts.includes(account.id)}
              />
              <span>{account.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="field-group">
        <legend className="field-label">Optional transaction fields</legend>
        <div className="checkbox-grid">
          {[
            "interest_date",
            "book_date",
            "process_date",
            "due_date",
            "payment_date",
            "invoice_date",
            "internal_reference",
            "notes",
            "attachments",
          ].map((field) => (
            <label className="checkbox-row" key={field}>
              <input
                type="checkbox"
                name={`field_${field}`}
                defaultChecked={defaults.optionalFields[field] ?? false}
              />
              <span>{field.replaceAll("_", " ")}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save preferences"}
      </Button>
      <p className="muted-note">
        Theme/frost/privacy are browser-only and managed in Appearance.
        Notification credentials are not stored here.
      </p>
    </form>
  );
}
