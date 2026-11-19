"use client";

import { useActionState, useState } from "react";
import { Button, ErrorSummary, MoneyDisplay } from "@/components/ui/primitives";
import {
  type EditorOptions,
  type TransactionDraftJournal,
  type TransactionGroupView,
} from "./service";
import {
  createTransactionAction,
  updateTransactionAction,
  type TransactionActionState,
} from "./actions";
import { DateInput } from "@/components/ui/date-field";

const INITIAL: TransactionActionState = { ok: false, message: "", errors: {} };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function blankJournal(): TransactionDraftJournal {
  return {
    journalId: undefined,
    type: "withdrawal",
    date: today(),
    amount: "",
    description: "",
    sourceId: "",
    destinationId: "",
    currencyCode: "EUR",
    foreignAmount: "",
    foreignCurrencyCode: "",
    categoryId: "",
    budgetId: "",
    billId: "",
    tags: "",
    notes: "",
    internalReference: "",
    externalUrl: "",
    reconciled: false,
  };
}

function fromGroup(
  group: TransactionGroupView,
  defaultCurrency: string,
): TransactionDraftJournal[] {
  return group.journals.map((journal) => ({
    journalId: journal.journalId,
    type: journal.type || "withdrawal",
    date: journal.date.slice(0, 10),
    amount: journal.amount,
    description: journal.description,
    sourceId: journal.sourceId,
    destinationId: journal.destinationId,
    currencyCode: journal.currencyCode || defaultCurrency,
    foreignAmount: journal.foreignAmount ?? "",
    foreignCurrencyCode: journal.foreignCurrencyCode ?? "",
    categoryId: journal.categoryId ?? "",
    budgetId: journal.budgetId ?? "",
    billId: journal.billId ?? "",
    tags: journal.tags.join(", "),
    notes: journal.notes ?? "",
    internalReference: journal.internalReference ?? "",
    externalUrl: "",
    reconciled: journal.reconciled,
  }));
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="field-error">{message}</p> : null;
}

export function TransactionForm({
  mode,
  group,
  options,
}: {
  mode: "create" | "edit";
  group?: TransactionGroupView;
  options: EditorOptions;
}) {
  const action =
    mode === "create" ? createTransactionAction : updateTransactionAction;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const defaultCurrency =
    options.currencies.find((currency) => currency.code === "EUR")?.code ??
    options.currencies[0]?.code ??
    "EUR";
  const [journals, setJournals] = useState<TransactionDraftJournal[]>(
    group
      ? fromGroup(group, defaultCurrency)
      : [{ ...blankJournal(), currencyCode: defaultCurrency }],
  );
  const [groupTitle, setGroupTitle] = useState(group?.title ?? "");

  function updateJournal(
    index: number,
    patch: Partial<TransactionDraftJournal>,
  ) {
    setJournals((current) =>
      current.map((journal, position) =>
        position === index ? { ...journal, ...patch } : journal,
      ),
    );
  }

  function addJournal() {
    setJournals((current) => [
      ...current,
      { ...blankJournal(), currencyCode: defaultCurrency },
    ]);
  }

  function removeJournal(index: number) {
    setJournals((current) =>
      current.filter((_, position) => position !== index),
    );
  }

  const summaryErrors = Object.entries(state.errors).map(([path, message]) => {
    const match = path.match(/^transactions\.(\d+)\.(.+)$/);
    return {
      id: match ? `journal-${match[1]}-${match[2]}` : "transaction-error",
      message: match
        ? `Split ${Number(match[1]) + 1} ${match[2]}: ${message}`
        : `${path}: ${message}`,
    };
  });
  if (state.message) {
    summaryErrors.unshift({ id: "transaction-error", message: state.message });
  }

  const reconciledPresent = journals.some((journal) => journal.reconciled);

  return (
    <form action={formAction} className="form-stack" id="transaction-error">
      {group ? <input type="hidden" name="group_id" value={group.id} /> : null}
      <input type="hidden" name="journal_count" value={journals.length} />
      <ErrorSummary title="Check the transaction" errors={summaryErrors} />

      <div className="field-group">
        <label className="field-label" htmlFor="group-title">
          Group title (optional)
        </label>
        <input
          className="select"
          id="group-title"
          name="group_title"
          value={groupTitle}
          onChange={(event) => setGroupTitle(event.target.value)}
          maxLength={1024}
        />
      </div>

      {reconciledPresent ? (
        <div className="panel" role="status">
          <strong>Reconciled split protected.</strong> Generic editing is
          disabled for reconciled rows. Saving will be rejected; use the
          reconciliation workflow where supported.
        </div>
      ) : null}

      {journals.map((journal, index) => {
        const disabled = journal.reconciled;
        const prefix = `journal_${index}_`;
        return (
          <fieldset
            className="panel journal-editor"
            key={`${journal.journalId ?? "new"}-${index}`}
            disabled={disabled}
          >
            <legend>
              Split {index + 1}
              {journal.journalId ? ` · journal ${journal.journalId}` : ""}
            </legend>
            {journal.journalId ? (
              <input
                type="hidden"
                name={`${prefix}journal_id`}
                value={journal.journalId}
              />
            ) : null}
            <input
              type="hidden"
              name={`${prefix}reconciled`}
              value={journal.reconciled ? "true" : ""}
            />

            <div className="form-grid">
              <div className="field-group">
                <label
                  className="field-label"
                  htmlFor={`journal-${index}-type`}
                >
                  Type
                </label>
                <select
                  className="select"
                  id={`journal-${index}-type`}
                  name={`${prefix}type`}
                  value={journal.type}
                  onChange={(event) =>
                    updateJournal(index, { type: event.target.value })
                  }
                >
                  <option value="withdrawal">Withdrawal</option>
                  <option value="deposit">Deposit</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
              <div className="field-group">
                <label
                  className="field-label"
                  htmlFor={`journal-${index}-date`}
                >
                  Date
                </label>
                <DateInput
                  id={`journal-${index}-date`}
                  name={`${prefix}date`}
                  value={journal.date}
                  onChange={(next) => updateJournal(index, { date: next })}
                  required
                />
                <FieldError
                  message={state.errors[`transactions.${index}.date`]}
                />
              </div>
              <div className="field-group">
                <label
                  className="field-label"
                  htmlFor={`journal-${index}-amount`}
                >
                  Amount
                </label>
                <input
                  className="select"
                  id={`journal-${index}-amount`}
                  name={`${prefix}amount`}
                  inputMode="decimal"
                  value={journal.amount}
                  onChange={(event) =>
                    updateJournal(index, { amount: event.target.value })
                  }
                  aria-invalid={
                    state.errors[`transactions.${index}.amount`]
                      ? true
                      : undefined
                  }
                  required
                />
                <FieldError
                  message={state.errors[`transactions.${index}.amount`]}
                />
              </div>
              <div className="field-group">
                <label
                  className="field-label"
                  htmlFor={`journal-${index}-currency`}
                >
                  Currency
                </label>
                <select
                  className="select"
                  id={`journal-${index}-currency`}
                  name={`${prefix}currency_code`}
                  value={journal.currencyCode}
                  onChange={(event) =>
                    updateJournal(index, { currencyCode: event.target.value })
                  }
                >
                  {options.currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-group">
              <label
                className="field-label"
                htmlFor={`journal-${index}-description`}
              >
                Description
              </label>
              <input
                className="select"
                id={`journal-${index}-description`}
                name={`${prefix}description`}
                value={journal.description}
                onChange={(event) =>
                  updateJournal(index, { description: event.target.value })
                }
                required
              />
              <FieldError
                message={state.errors[`transactions.${index}.description`]}
              />
            </div>

            <div className="form-grid">
              <div className="field-group">
                <label
                  className="field-label"
                  htmlFor={`journal-${index}-source`}
                >
                  Source account
                </label>
                <select
                  className="select"
                  id={`journal-${index}-source`}
                  name={`${prefix}source_id`}
                  value={journal.sourceId}
                  onChange={(event) =>
                    updateJournal(index, { sourceId: event.target.value })
                  }
                  required
                >
                  <option value="">Choose source</option>
                  {options.accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
                <FieldError
                  message={state.errors[`transactions.${index}.source_id`]}
                />
              </div>
              <div className="field-group">
                <label
                  className="field-label"
                  htmlFor={`journal-${index}-destination`}
                >
                  Destination account
                </label>
                <select
                  className="select"
                  id={`journal-${index}-destination`}
                  name={`${prefix}destination_id`}
                  value={journal.destinationId}
                  onChange={(event) =>
                    updateJournal(index, { destinationId: event.target.value })
                  }
                  required
                >
                  <option value="">Choose destination</option>
                  {options.accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
                <FieldError
                  message={state.errors[`transactions.${index}.destination_id`]}
                />
              </div>
            </div>

            <details className="field-group">
              <summary>Classification and optional fields</summary>
              <div className="form-grid">
                <div className="field-group">
                  <label
                    className="field-label"
                    htmlFor={`journal-${index}-category`}
                  >
                    Category
                  </label>
                  <select
                    className="select"
                    id={`journal-${index}-category`}
                    name={`${prefix}category_id`}
                    value={journal.categoryId}
                    onChange={(event) =>
                      updateJournal(index, { categoryId: event.target.value })
                    }
                  >
                    <option value="">No category</option>
                    {options.categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label
                    className="field-label"
                    htmlFor={`journal-${index}-budget`}
                  >
                    Budget
                  </label>
                  <select
                    className="select"
                    id={`journal-${index}-budget`}
                    name={`${prefix}budget_id`}
                    value={journal.budgetId}
                    onChange={(event) =>
                      updateJournal(index, { budgetId: event.target.value })
                    }
                  >
                    <option value="">No budget</option>
                    {options.budgets.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label
                    className="field-label"
                    htmlFor={`journal-${index}-bill`}
                  >
                    Subscription / bill
                  </label>
                  <select
                    className="select"
                    id={`journal-${index}-bill`}
                    name={`${prefix}bill_id`}
                    value={journal.billId}
                    onChange={(event) =>
                      updateJournal(index, { billId: event.target.value })
                    }
                  >
                    <option value="">No subscription</option>
                    {options.bills.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field-group">
                <label
                  className="field-label"
                  htmlFor={`journal-${index}-tags`}
                >
                  Tags (comma separated)
                </label>
                <input
                  className="select"
                  id={`journal-${index}-tags`}
                  name={`${prefix}tags`}
                  value={journal.tags}
                  onChange={(event) =>
                    updateJournal(index, { tags: event.target.value })
                  }
                  list={`tags-${index}`}
                />
                <datalist id={`tags-${index}`}>
                  {options.tags.map((tag) => (
                    <option key={tag.id} value={tag.name} />
                  ))}
                </datalist>
              </div>
              <div className="form-grid">
                <div className="field-group">
                  <label
                    className="field-label"
                    htmlFor={`journal-${index}-foreign-amount`}
                  >
                    Foreign amount
                  </label>
                  <input
                    className="select"
                    id={`journal-${index}-foreign-amount`}
                    name={`${prefix}foreign_amount`}
                    inputMode="decimal"
                    value={journal.foreignAmount}
                    onChange={(event) =>
                      updateJournal(index, {
                        foreignAmount: event.target.value,
                      })
                    }
                  />
                  <FieldError
                    message={
                      state.errors[`transactions.${index}.foreign_amount`]
                    }
                  />
                </div>
                <div className="field-group">
                  <label
                    className="field-label"
                    htmlFor={`journal-${index}-foreign-currency`}
                  >
                    Foreign currency
                  </label>
                  <select
                    className="select"
                    id={`journal-${index}-foreign-currency`}
                    name={`${prefix}foreign_currency_code`}
                    value={journal.foreignCurrencyCode}
                    onChange={(event) =>
                      updateJournal(index, {
                        foreignCurrencyCode: event.target.value,
                      })
                    }
                  >
                    <option value="">Same as amount currency</option>
                    {options.currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name} ({currency.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field-group">
                <label
                  className="field-label"
                  htmlFor={`journal-${index}-notes`}
                >
                  Notes
                </label>
                <textarea
                  className="select"
                  id={`journal-${index}-notes`}
                  name={`${prefix}notes`}
                  rows={3}
                  value={journal.notes}
                  onChange={(event) =>
                    updateJournal(index, { notes: event.target.value })
                  }
                />
              </div>
              <div className="form-grid">
                <div className="field-group">
                  <label
                    className="field-label"
                    htmlFor={`journal-${index}-internal-reference`}
                  >
                    Internal reference
                  </label>
                  <input
                    className="select"
                    id={`journal-${index}-internal-reference`}
                    name={`${prefix}internal_reference`}
                    value={journal.internalReference}
                    onChange={(event) =>
                      updateJournal(index, {
                        internalReference: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="field-group">
                  <label
                    className="field-label"
                    htmlFor={`journal-${index}-external-url`}
                  >
                    External URL
                  </label>
                  <input
                    className="select"
                    id={`journal-${index}-external-url`}
                    name={`${prefix}external_url`}
                    type="url"
                    value={journal.externalUrl}
                    onChange={(event) =>
                      updateJournal(index, { externalUrl: event.target.value })
                    }
                  />
                </div>
              </div>
            </details>

            {journal.amount && !fieldHasError(state.errors, index, "amount") ? (
              <p className="muted-note">
                Preview:{" "}
                <MoneyDisplay
                  amount={journal.amount}
                  currency={journal.currencyCode}
                  decimalPlaces={
                    options.currencies.find(
                      (currency) => currency.code === journal.currencyCode,
                    )
                      ? 2
                      : 2
                  }
                />
              </p>
            ) : null}

            {journals.length > 1 && !journal.reconciled ? (
              <div className="button-row">
                <Button
                  type="button"
                  tone="quiet"
                  onClick={() => removeJournal(index)}
                >
                  Remove this split
                </Button>
              </div>
            ) : null}
            {journal.reconciled ? (
              <p className="muted-note">
                Reconciled: amount, accounts and currency are intentionally not
                editable through generic transaction editing.
              </p>
            ) : null}
          </fieldset>
        );
      })}

      <div className="button-row">
        <Button type="button" tone="quiet" onClick={addJournal}>
          Add split
        </Button>
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving transaction..."
            : mode === "create"
              ? "Create transaction"
              : "Save all splits"}
        </Button>
      </div>

      <fieldset className="field-group">
        <legend className="field-label">Write options</legend>
        <div className="checkbox-grid">
          <label className="checkbox-row">
            <input type="checkbox" name="apply_rules" defaultChecked />
            <span>Apply Firefly rules after saving</span>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" name="fire_webhooks" />
            <span>Fire webhooks after saving</span>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" name="error_if_duplicate_hash" />
            <span>Reject duplicate transactions</span>
          </label>
        </div>
        <p className="muted-note">
          Changes are confirmed with an authoritative refetch. There is no
          automatic retry after an uncertain save.
        </p>
      </fieldset>
    </form>
  );
}

function fieldHasError(
  errors: Record<string, string>,
  index: number,
  field: string,
): boolean {
  return Boolean(errors[`transactions.${index}.${field}`]);
}
