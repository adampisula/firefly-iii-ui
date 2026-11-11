"use client";
import { useActionState } from "react";
import { Button, ErrorSummary } from "@/components/ui/primitives";
import { saveAdministrationAction, type AdminState } from "./actions";
const INITIAL: AdminState = { ok: false, message: "" };
export function AdministrationForm({
  id,
  title,
  currency,
  currencies,
}: {
  id: string;
  title: string;
  currency: string;
  currencies: readonly { code: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    saveAdministrationAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      <input type="hidden" name="group_id" value={id} />
      {state.message ? (
        <ErrorSummary
          title={state.ok ? "Saved" : "Blocked"}
          errors={[{ id: "admin", message: state.message }]}
        />
      ) : null}
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="admin-title">
            Administration title
          </label>
          <input
            className="select"
            id="admin-title"
            name="title"
            defaultValue={title}
            required
            maxLength={255}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="admin-currency">
            Primary currency
          </label>
          <select
            className="select"
            id="admin-currency"
            name="primary_currency_code"
            defaultValue={currency}
          >
            {currencies.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name} ({item.code})
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save administration"}
      </Button>
      <p className="muted-note">
        Administration ID is separate from user ID. Existing amounts are not
        relabeled; conversion/display changes follow backend behavior.
      </p>
    </form>
  );
}
