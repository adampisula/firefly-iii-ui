"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Button,
  ErrorSummary,
  Status,
  TextField,
} from "@/components/ui/primitives";
import { DEFAULT_ACCOUNT_CHOICES, type CurrencyOption } from "./service";

export function SetupForm({
  currencies,
  backendPublicUrl,
}: {
  currencies: readonly CurrencyOption[];
  backendPublicUrl: string | null;
}) {
  const router = useRouter();
  const preferred =
    currencies.find((currency) => currency.code === "EUR") ??
    currencies.find((currency) => currency.code === "USD") ??
    currencies[0];
  const [currencyCode, setCurrencyCode] = useState(preferred?.code ?? "");
  const [names, setNames] = useState<string[]>(
    DEFAULT_ACCOUNT_CHOICES.map((choice) => choice.name),
  );
  const [errors, setErrors] = useState<{ id: string; message: string }[]>([]);
  const [working, setWorking] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setWorking(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currencyCode,
          accounts: DEFAULT_ACCOUNT_CHOICES.map((choice, index) => ({
            role: choice.role,
            name: names[index],
          })),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setErrors([
          { id: "setup-summary", message: payload.error ?? "Setup failed." },
        ]);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setErrors([
        {
          id: "setup-summary",
          message: "The frontend could not reach its setup handler.",
        },
      ]);
    } finally {
      setWorking(false);
    }
  }

  if (currencies.length === 0) {
    return (
      <div className="panel">
        <h2>No currencies are available</h2>
        <p>
          Firefly did not return any transaction currencies. Finish the native
          backend first-run step, then reload this page.
        </p>
        {backendPublicUrl ? (
          <a className="text-link" href={backendPublicUrl}>
            Open the native Firefly interface
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <form className="form-stack" onSubmit={submit} id="setup-summary">
      <ErrorSummary errors={errors} />
      <div className="field-group">
        <label className="field-label" htmlFor="setup-currency">
          Primary currency
        </label>
        <select
          className="select"
          id="setup-currency"
          value={currencyCode}
          onChange={(event) => setCurrencyCode(event.target.value)}
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.name} ({currency.code})
            </option>
          ))}
        </select>
        <p className="muted-note">
          This enables the currency for your administration and sets it as the
          primary currency. Existing enabled currencies are not disabled.
        </p>
      </div>

      {DEFAULT_ACCOUNT_CHOICES.map((choice, index) => (
        <TextField
          key={choice.role}
          id={`setup-account-${choice.role}`}
          label={
            choice.role === "defaultAsset"
              ? "Everyday account name"
              : choice.role === "savingAsset"
                ? "Savings account name"
                : "Cash wallet name"
          }
          value={names[index]}
          onChange={(event) => {
            const next = [...names];
            next[index] = event.target.value;
            setNames(next);
          }}
          required
          hint="An asset account with a zero opening balance. Rename it now or later."
        />
      ))}

      <p className="muted-note">
        Setup creates three asset accounts and dashboard defaults through
        existing Firefly API operations. If it is interrupted, reloading and
        submitting again skips accounts that already exist. Firefly cannot
        execute bank payments; these are bookkeeping accounts you manage.
      </p>

      <div className="button-row">
        <Button type="submit" disabled={working}>
          {working ? "Creating accounts..." : "Create starting accounts"}
        </Button>
        <Status kind="neutral">Uses the official Firefly III 6.7.9 API</Status>
      </div>
    </form>
  );
}
