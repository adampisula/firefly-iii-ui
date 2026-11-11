"use client";

import { useEffect, useState } from "react";
import { Status, TextField } from "@/components/ui/primitives";
import { AUTOCOMPLETE_FAMILIES, type AutocompleteOption } from "./service";

export function AutocompleteExplorer() {
  const [familyId, setFamilyId] = useState(AUTOCOMPLETE_FAMILIES[0].id);
  const family =
    AUTOCOMPLETE_FAMILIES.find((item) => item.id === familyId) ??
    AUTOCOMPLETE_FAMILIES[0];
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState("");
  const [date, setDate] = useState("");
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AutocompleteOption | null>(null);

  useEffect(() => {
    if (!query.trim()) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ query, limit: "15" });
        if (family.supportsTypes && types.trim())
          params.set("types", types.trim());
        if (family.supportsDate && date) params.set("date", date);
        const response = await fetch(
          `/api/autocomplete/${family.id}?${params.toString()}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as {
          options?: AutocompleteOption[];
          error?: string;
        };
        if (!response.ok) {
          setError(payload.error ?? "The lookup failed.");
          setOptions([]);
          return;
        }
        setOptions(payload.options ?? []);
      } catch (caught) {
        if ((caught as Error).name !== "AbortError") {
          setError("The lookup could not be completed.");
          setOptions([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    query,
    family.id,
    family.supportsTypes,
    family.supportsDate,
    types,
    date,
  ]);

  return (
    <div className="form-stack">
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="lookup-family">
            Lookup family
          </label>
          <select
            className="select"
            id="lookup-family"
            value={familyId}
            onChange={(event) => {
              setFamilyId(event.target.value);
              setQuery("");
              setOptions([]);
              setSelected(null);
              setError(null);
            }}
          >
            {AUTOCOMPLETE_FAMILIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <p className="muted-note">{family.description}</p>
        </div>
        <TextField
          id="lookup-query"
          label="Find by name"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(null);
            if (!event.target.value.trim()) {
              setOptions([]);
              setError(null);
            }
          }}
          hint="Results come from existing Firefly data. Lookup never creates a record."
        />
        {family.supportsTypes ? (
          <TextField
            id="lookup-types"
            label="Account types (optional)"
            value={types}
            onChange={(event) => setTypes(event.target.value)}
            hint="Comma-separated: asset, expense, revenue, liabilities."
          />
        ) : null}
        {family.supportsDate ? (
          <div className="field-group">
            <label className="field-label" htmlFor="lookup-date">
              Balance or result date (optional)
            </label>
            <input
              className="select"
              id="lookup-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
        ) : null}
      </div>

      <p aria-live="polite" className="muted-note">
        {loading
          ? "Searching Firefly"
          : error
            ? error
            : query.trim()
              ? `${options.length} result${options.length === 1 ? "" : "s"}`
              : "Type to search. Requests are debounced and cancelled when the query changes."}
      </p>

      {error ? <Status kind="error">{error}</Status> : null}

      {options.length > 0 ? (
        <ul
          className="lookup-list"
          aria-label={`${family.label} lookup results`}
        >
          {options.map((option) => (
            <li key={`${family.id}-${option.id}`}>
              <button
                className="lookup-option"
                type="button"
                aria-pressed={selected?.id === option.id}
                onClick={() => setSelected(option)}
              >
                <span>{option.label}</span>
                {option.description ? (
                  <span className="muted-note">{option.description}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {selected ? (
        <p className="selected-value" aria-live="polite">
          Selected {family.label.toLowerCase()}:{" "}
          <strong>{selected.label}</strong> (ID {selected.id}). The owning
          domain editor receives this existing ID.
        </p>
      ) : null}

      {family.allowsCreateByText &&
      query.trim() &&
      options.length === 0 &&
      !loading ? (
        <p className="muted-note">
          No existing match. New {family.label.toLowerCase()} names are created
          only in the owning editor, not by this lookup.
        </p>
      ) : null}
    </div>
  );
}
