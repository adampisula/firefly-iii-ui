"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { formatEnglishMoney } from "@/lib/i18n/messages";
import { useOptionalPrivacy } from "@/components/shell/privacy-context";
import styles from "./primitives.module.css";

type ButtonTone = "primary" | "quiet" | "danger";

export function Button({
  children,
  tone = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  return (
    <button
      className={`${styles.button} ${styles[`button_${tone}`]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  return (
    <section
      className={`${styles.card} ${className}`.trim()}
      aria-labelledby={title ? titleId : undefined}
    >
      {title ? (
        <h2 id={titleId} className={styles.cardTitle}>
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

export function Status({
  children,
  kind = "neutral",
}: {
  children: ReactNode;
  kind?: "neutral" | "success" | "warning" | "error";
}) {
  return (
    <span
      className={`${styles.status} ${styles[`status_${kind}`]}`}
      role="status"
    >
      {children}
    </span>
  );
}

export interface TextFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  type?: "text" | "email" | "search";
}

export function TextField({
  id,
  label,
  hint,
  error,
  type = "text",
  ...inputProps
}: TextFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : "", error ? errorId : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {inputProps.required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        className={styles.input}
        id={id}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />
      {hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className={styles.fieldError} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function DateField({
  id,
  label,
  value,
  onChange,
  required,
  disabled,
  name,
  error,
}: {
  id: string;
  label: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  error?: string;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        className={styles.input}
        id={id}
        name={name}
        type="date"
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
      />
      {error ? <p className={styles.fieldError}>{error}</p> : null}
    </div>
  );
}

export function CurrencyField({
  id,
  label,
  value,
  currencies,
  onChange,
  disabled,
  name,
  error,
}: {
  id: string;
  label: string;
  value?: string;
  currencies: readonly { code: string; name: string }[];
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
  name?: string;
  error?: string;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <select
        className={styles.input}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
      >
        {currencies.map(({ code, name }) => (
          <option key={code} value={code}>
            {name} ({code})
          </option>
        ))}
      </select>
      {error ? <p className={styles.fieldError}>{error}</p> : null}
    </div>
  );
}

export function MoneyDisplay({
  amount,
  currency,
  decimalPlaces,
  locale = "en-US",
}: {
  amount: string;
  currency: string;
  decimalPlaces: number;
  locale?: string;
}) {
  const { privacy } = useOptionalPrivacy();
  if (privacy) {
    return (
      <output
        className={styles.money}
        aria-label="Amount hidden by privacy mode"
      >
        Amount hidden
      </output>
    );
  }
  const formatted = formatEnglishMoney(
    { amount, code: currency, decimalPlaces },
    locale,
  );
  return <output className={styles.money}>{formatted}</output>;
}

export function SplitRow({
  journalId,
  description,
  amount,
}: {
  journalId: string;
  description: string;
  amount: { amount: string; currency: string; decimalPlaces: number };
}) {
  return (
    <li className={styles.splitRow}>
      <span>
        <span className={styles.splitDescription}>{description}</span>
        <span className={styles.splitId}>Journal ID: {journalId}</span>
      </span>
      <MoneyDisplay
        amount={amount.amount}
        currency={amount.currency}
        decimalPlaces={amount.decimalPlaces}
      />
    </li>
  );
}

export function ErrorSummary({
  errors,
  title = "There is a problem",
}: {
  errors: readonly { id: string; message: string }[];
  title?: string;
}) {
  const titleId = useId();
  if (errors.length === 0) return null;
  return (
    <section
      className={styles.errorSummary}
      role="alert"
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <h2 id={titleId}>{title}</h2>
      <ul>
        {errors.map(({ id, message }) => (
          <li key={id}>
            <a href={`#${id}`}>{message}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export interface ComboboxOption {
  value: string;
  label: string;
}

export function AsyncCombobox({
  id,
  label,
  options,
  value,
  onValueChange,
  loading = false,
  error,
  disabled = false,
}: {
  id: string;
  label: string;
  options: readonly ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
}) {
  const generatedId = useId();
  const listId = `${generatedId}-list`;
  const hintId = `${generatedId}-hint`;
  const [query, setQuery] = useState(
    options.find((option) => option.value === value)?.label ?? "",
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const filtered = options.filter((option) =>
    option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) =>
        Math.min(index + 1, Math.max(filtered.length - 1, 0)),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && filtered[activeIndex]) {
      event.preventDefault();
      const option = filtered[activeIndex];
      setQuery(option.label);
      onValueChange(option.value);
      setOpen(false);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.combobox}>
        <input
          className={styles.input}
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={
            open && !loading && filtered[activeIndex]
              ? `${listId}-option-${activeIndex}`
              : undefined
          }
          aria-describedby={hintId}
          aria-invalid={error ? true : undefined}
          value={query}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={(event) => {
            if (
              !event.currentTarget.parentElement?.contains(
                event.relatedTarget as Node,
              )
            )
              setOpen(false);
          }}
        />
        <ul
          className={styles.optionList}
          id={listId}
          role="listbox"
          hidden={!open}
        >
          {loading || filtered.length === 0 ? (
            <li
              className={styles.optionMessage}
              role="option"
              aria-selected="false"
              aria-disabled="true"
            >
              {loading ? "Loading options" : "No matching options"}
            </li>
          ) : null}
          {!loading &&
            filtered.map((option, index) => (
              <li
                className={styles.option}
                id={`${listId}-option-${index}`}
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                data-active={index === activeIndex || undefined}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setQuery(option.label);
                  onValueChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </li>
            ))}
        </ul>
      </div>
      <p className={styles.hint} id={hintId} aria-live="polite">
        {error ?? (loading ? "Loading options" : "Type to filter options")}
      </p>
    </div>
  );
}

export function TagList({
  label,
  tags,
  onRemove,
}: {
  label: string;
  tags: readonly { id: string; label: string }[];
  onRemove?: (id: string) => void;
}) {
  return (
    <ul className={styles.tagList} aria-label={label}>
      {tags.map((tag) => (
        <li className={styles.tag} key={tag.id}>
          <span>{tag.label}</span>
          {onRemove ? (
            <Button
              type="button"
              tone="quiet"
              aria-label={`Remove ${tag.label}`}
              onClick={() => onRemove(tag.id)}
            >
              ×
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function Tabs({
  tabs,
}: {
  tabs: readonly { id: string; label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(0);
  const tabListId = useId();
  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + offset + tabs.length) % tabs.length;
    setActive(next);
    document.getElementById(`${tabListId}-tab-${next}`)?.focus();
  }
  return (
    <div>
      <div className={styles.tabs} role="tablist" aria-label="Sections">
        {tabs.map((tab, index) => (
          <button
            id={`${tabListId}-tab-${index}`}
            key={tab.id}
            className={styles.tab}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-controls={`${tabListId}-panel-${index}`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <section
          className={styles.tabPanel}
          id={`${tabListId}-panel-${index}`}
          key={tab.id}
          role="tabpanel"
          aria-labelledby={`${tabListId}-tab-${index}`}
          hidden={index !== active}
          tabIndex={0}
        >
          {tab.content}
        </section>
      ))}
    </div>
  );
}

export function Tooltip({
  text,
  children,
}: {
  text: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <span className={styles.tooltip} tabIndex={0} aria-describedby={id}>
      {children}
      <span className={styles.tooltipText} id={id} role="tooltip">
        {text}
      </span>
    </span>
  );
}

export function Menu({
  label,
  actions,
}: {
  label: string;
  actions: readonly {
    label: string;
    onSelect: () => void;
    disabled?: boolean;
  }[];
}) {
  return (
    <details className={styles.menu}>
      <summary className={styles.menuSummary}>{label}</summary>
      <div className={styles.menuItems}>
        {actions.map((action) => (
          <Button
            key={action.label}
            type="button"
            tone="quiet"
            disabled={action.disabled}
            onClick={(event) => {
              action.onSelect();
              const details = event.currentTarget.closest("details");
              if (details) details.open = false;
            }}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </details>
  );
}

export function Dialog({
  open,
  title,
  children,
  onOpenChange,
  drawer = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  drawer?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onOpenChange(false);
    };
    window.addEventListener("keydown", handleEscape, true);
    return () => window.removeEventListener("keydown", handleEscape, true);
  }, [open, onOpenChange]);
  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${drawer ? styles.drawer : ""}`.trim()}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onOpenChange(false);
        }
      }}
      onClose={() => {
        if (open) onOpenChange(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div className={styles.dialogHeader}>
        <h2 id={titleId}>{title}</h2>
        <Button
          type="button"
          tone="quiet"
          aria-label="Close dialog"
          onClick={() => onOpenChange(false)}
        >
          ×
        </Button>
      </div>
      <div className={styles.dialogBody}>{children}</div>
    </dialog>
  );
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <Button
        type="button"
        tone="quiet"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span aria-live="polite">
        Page {page} of {pageCount}
      </span>
      <Button
        type="button"
        tone="quiet"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}

export interface TableColumn<Row> {
  key: keyof Row;
  label: string;
}

export function SelectableTable<Row extends { id: string }>({
  caption,
  columns,
  rows,
  selectedIds,
  onSelectionChange,
}: {
  caption: string;
  columns: readonly TableColumn<Row>[];
  rows: readonly Row[];
  selectedIds: readonly string[];
  onSelectionChange: (ids: string[]) => void;
}) {
  const allSelected =
    rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));
  function toggle(id: string, checked: boolean) {
    const selected = new Set(selectedIds);
    if (checked) selected.add(id);
    else selected.delete(id);
    onSelectionChange([...selected]);
  }
  return (
    <div
      className={styles.tableScroll}
      tabIndex={0}
      role="region"
      aria-label={`${caption} table`}
    >
      <table className={styles.table}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className={styles.visuallyHidden}>Select rows</span>
              <input
                type="checkbox"
                aria-label="Select all rows"
                checked={allSelected}
                onChange={(event) =>
                  onSelectionChange(
                    event.target.checked ? rows.map((row) => row.id) : [],
                  )
                }
              />
            </th>
            {columns.map((column) => (
              <th scope="col" key={String(column.key)}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Select row ${row.id}`}
                  checked={selectedIds.includes(row.id)}
                  onChange={(event) => toggle(row.id, event.target.checked)}
                />
              </td>
              {columns.map((column) => (
                <td key={String(column.key)}>
                  {String(row[column.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartDataTable<Row extends Record<string, string | number>>({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: readonly TableColumn<Row>[];
  rows: readonly Row[];
}) {
  return (
    <div
      className={styles.tableScroll}
      tabIndex={0}
      role="region"
      aria-label={`${caption} chart data`}
    >
      <table className={styles.table}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th scope="col" key={String(column.key)}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={String(column.key)}>
                  {String(row[column.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow?: string;
  title: string;
  lede?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderText}>
        {eyebrow ? <p className={styles.pageEyebrow}>{eyebrow}</p> : null}
        <h1>{title}</h1>
        {lede ? <div className={styles.pageLede}>{lede}</div> : null}
      </div>
      {actions ? <div className={styles.pageActions}>{actions}</div> : null}
    </header>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className={styles.statGrid}>{children}</div>;
}

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "good" | "warn";
}) {
  return (
    <div className={styles.statTile} data-tone={tone}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
      {hint ? <span className={styles.statHint}>{hint}</span> : null}
    </div>
  );
}

export interface ChartPoint {
  label: string;
  amount: string;
  currency: string;
  decimalPlaces: number;
}

function chartText(point: ChartPoint): string {
  return `${point.amount} ${point.currency}`;
}

function ChartTable({
  caption,
  points,
}: {
  caption: string;
  points: readonly ChartPoint[];
}) {
  return (
    <ChartDataTable
      caption={caption}
      columns={[
        { key: "label", label: "Period" },
        { key: "value", label: "Amount" },
      ]}
      rows={points.map((point) => ({
        label: point.label,
        value: chartText(point),
      }))}
    />
  );
}

export function LineChart({
  title,
  summary,
  points,
}: {
  title: string;
  summary: string;
  points: readonly ChartPoint[];
}) {
  const { privacy } = useOptionalPrivacy();
  if (privacy) {
    return (
      <div className={styles.chartFrame}>
        <p className={styles.chartTitle}>{title}</p>
        <p className={styles.chartEmpty}>Amounts are hidden by privacy mode.</p>
      </div>
    );
  }
  if (points.length === 0) {
    return (
      <div className={styles.chartFrame}>
        <p className={styles.chartTitle}>{title}</p>
        <p className={styles.chartEmpty}>
          No chart data is reported for this range.
        </p>
      </div>
    );
  }
  const values = points.map((point) => Number(point.amount));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const line = points
    .map((point, index) => {
      const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
      const y = 94 - ((Number(point.amount) - min) / span) * 82;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <div className={styles.chartFrame}>
      <p className={styles.chartTitle}>{title}</p>
      <p className={styles.chartSummary}>{summary}</p>
      <div
        className={styles.lineChart}
        role="img"
        aria-label={`${title}. ${summary}`}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            points={line}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <ChartTable caption={title} points={points} />
    </div>
  );
}

export function BarChart({
  title,
  summary,
  points,
}: {
  title: string;
  summary: string;
  points: readonly ChartPoint[];
}) {
  const { privacy } = useOptionalPrivacy();
  if (privacy) {
    return (
      <div className={styles.chartFrame}>
        <p className={styles.chartTitle}>{title}</p>
        <p className={styles.chartEmpty}>Amounts are hidden by privacy mode.</p>
      </div>
    );
  }
  if (points.length === 0) {
    return (
      <div className={styles.chartFrame}>
        <p className={styles.chartTitle}>{title}</p>
        <p className={styles.chartEmpty}>
          No chart data is reported for this range.
        </p>
      </div>
    );
  }
  const max = Math.max(
    ...points.map((point) => Math.abs(Number(point.amount))),
    1,
  );
  return (
    <div className={styles.chartFrame}>
      <p className={styles.chartTitle}>{title}</p>
      <p className={styles.chartSummary}>{summary}</p>
      <div
        className={styles.barChart}
        role="img"
        aria-label={`${title}. ${summary}`}
      >
        {points.map((point) => (
          <div className={styles.barColumn} key={point.label}>
            <span className={styles.barValue}>
              <MoneyDisplay
                amount={point.amount}
                currency={point.currency}
                decimalPlaces={point.decimalPlaces}
              />
            </span>
            <span
              className={styles.bar}
              style={{
                height: `${Math.max(6, (Math.abs(Number(point.amount)) / max) * 100)}%`,
              }}
            />
            <span className={styles.barLabel}>{point.label}</span>
          </div>
        ))}
      </div>
      <ChartTable caption={title} points={points} />
    </div>
  );
}

export function ProgressRow({
  label,
  current,
  target,
  currency,
  decimalPlaces,
  percentage,
  detail,
}: {
  label: string;
  current: string;
  target?: string | null;
  currency: string;
  decimalPlaces: number;
  percentage?: number | null;
  detail?: string;
}) {
  const percent =
    typeof percentage === "number"
      ? Math.min(100, Math.max(0, percentage))
      : target && Number(target) > 0
        ? Math.min(100, Math.max(0, (Number(current) / Number(target)) * 100))
        : null;
  return (
    <div className={styles.progressRow}>
      <div className={styles.progressHead}>
        <span className={styles.progressLabel}>{label}</span>
        <span className={styles.progressAmounts}>
          <MoneyDisplay
            amount={current}
            currency={currency}
            decimalPlaces={decimalPlaces}
          />
          {target ? (
            <>
              {" / "}
              <MoneyDisplay
                amount={target}
                currency={currency}
                decimalPlaces={decimalPlaces}
              />
            </>
          ) : null}
        </span>
      </div>
      {percent !== null ? (
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
      ) : null}
      {detail ? <p className={styles.progressDetail}>{detail}</p> : null}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className={styles.filterBar}>{children}</div>;
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className={styles.emptyState}>
      <strong>{title}</strong>
      {children ? <div>{children}</div> : null}
    </div>
  );
}
