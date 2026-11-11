"use client";

import { useState } from "react";
import {
  Button,
  ErrorSummary,
  MoneyDisplay,
  TextField,
} from "@/components/ui/primitives";
import type { AccountSearchResult } from "./service";

const FIELDS = [
  { value: "all", label: "Any field" },
  { value: "name", label: "Name" },
  { value: "iban", label: "IBAN" },
  { value: "number", label: "Account number" },
  { value: "id", label: "Account ID" },
] as const;

const TYPES = [
  { value: "all", label: "All types" },
  { value: "asset", label: "Asset" },
  { value: "expense", label: "Expense" },
  { value: "revenue", label: "Revenue" },
  { value: "liabilities", label: "Liabilities" },
] as const;

export function AccountSearchPanel() {
  const [query, setQuery] = useState("");
  const [field, setField] = useState("all");
  const [type, setType] = useState("all");
  const [accounts, setAccounts] = useState<AccountSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ query, field, type });
      const response = await fetch(`/api/search/accounts?${params.toString()}`);
      const payload = (await response.json()) as {
        accounts?: AccountSearchResult[];
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? "The account search failed.");
        setAccounts([]);
      } else {
        setAccounts(payload.accounts ?? []);
      }
      setSearched(true);
    } catch {
      setError("The account search could not be completed.");
      setAccounts([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      {error ? (
        <ErrorSummary
          errors={[{ id: "account-search-error", message: error }]}
        />
      ) : null}
      <div className="form-grid">
        <TextField
          id="account-search-query"
          label="Account search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          required
          hint="Use the backend field selected below. Empty searches are rejected."
        />
        <div className="field-group">
          <label className="field-label" htmlFor="account-search-field">
            Search field
          </label>
          <select
            className="select"
            id="account-search-field"
            value={field}
            onChange={(event) => setField(event.target.value)}
          >
            {FIELDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="account-search-type">
            Account type
          </label>
          <select
            className="select"
            id="account-search-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="button-row">
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? "Searching..." : "Search accounts"}
        </Button>
      </div>

      <p aria-live="polite" className="muted-note">
        {loading
          ? "Searching Firefly accounts"
          : searched
            ? `${accounts.length} account${accounts.length === 1 ? "" : "s"} found`
            : "The account search endpoint differs from transaction search and returns its own result set."}
      </p>

      {accounts.length > 0 ? (
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Account search results"
        >
          <table className="data-table">
            <caption>Account search results</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">Balance</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>
                    {account.name}
                    <span className="muted-note"> ID {account.id}</span>
                  </td>
                  <td>
                    {account.type}
                    {account.role ? ` / ${account.role}` : ""}
                  </td>
                  <td>
                    {account.currentBalance ? (
                      <MoneyDisplay
                        amount={account.currentBalance}
                        currency={account.currencyCode}
                        decimalPlaces={account.decimalPlaces}
                      />
                    ) : (
                      "Not reported"
                    )}
                  </td>
                  <td>{account.active ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </form>
  );
}
