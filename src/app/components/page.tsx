"use client";

import { useState } from "react";
import {
  AsyncCombobox,
  Button,
  Card,
  ChartDataTable,
  CurrencyField,
  DateField,
  Dialog,
  ErrorSummary,
  Menu,
  MoneyDisplay,
  Pagination,
  SelectableTable,
  SplitRow,
  Status,
  Tabs,
  TagList,
  TextField,
  Tooltip,
} from "@/components/ui/primitives";

const sampleRows = [
  { id: "sample-1", name: "Example row A", detail: "Illustrative only" },
  { id: "sample-2", name: "Example row B", detail: "Illustrative only" },
];
const sampleChartRows = [
  { period: "Example period", measure: "Illustrative value only" },
];

export default function ComponentGalleryPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [page, setPage] = useState(1);
  const [currency, setCurrency] = useState("EUR");

  return (
    <main className="page component-gallery">
      <a className="skip-link" href="#gallery-content">
        Skip to component examples
      </a>
      <header className="brand-bar">
        <span className="brand-mark" aria-hidden="true">
          F
        </span>
        <span>Firefly</span>
      </header>
      <section
        className="gallery-intro"
        id="gallery-content"
        aria-labelledby="gallery-title"
      >
        <p className="eyebrow">Shared interface foundations</p>
        <h1 id="gallery-title">Accessible component examples</h1>
        <p className="intro">
          These examples demonstrate presentation and interaction states only.
          They are not account data and do not perform financial actions.
        </p>
        <p className="gallery-note">
          Sample values below are illustrative component data, not Firefly
          records.
        </p>
      </section>

      <div className="gallery-grid">
        <Card title="Actions and status">
          <div className="gallery-row">
            <Button type="button" onClick={() => setDialogOpen(true)}>
              Open dialog
            </Button>
            <Button
              type="button"
              tone="quiet"
              onClick={() => setDrawerOpen(true)}
            >
              Open drawer
            </Button>
            <Button type="button" disabled>
              Unavailable action
            </Button>
          </div>
          <div className="gallery-row">
            <Status>Ready for setup</Status>
            <Status kind="success">Saved</Status>
            <Status kind="warning">Permission required</Status>
            <Status kind="error">Example error</Status>
          </div>
          <Menu
            label="More options"
            actions={[
              { label: "Example action", onSelect: () => undefined },
              {
                label: "Disabled example",
                onSelect: () => undefined,
                disabled: true,
              },
            ]}
          />
          <Tooltip text="More information about this example">
            Focusable help
          </Tooltip>
        </Card>

        <Card title="Fields and validation">
          <ErrorSummary
            errors={[
              { id: "sample-name", message: "Enter a name to continue." },
            ]}
          />
          <div className="gallery-form">
            <TextField
              id="sample-name"
              label="Example name"
              hint="Use a clear, recognizable name."
              error="This example shows an associated field error."
              required
            />
            <DateField
              id="sample-date"
              label="Date-only value"
              value="2026-11-11"
              onChange={() => undefined}
            />
            <CurrencyField
              id="sample-currency"
              label="Currency selector"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              currencies={[
                { code: "EUR", name: "Euro" },
                { code: "JPY", name: "Japanese yen" },
                { code: "KWD", name: "Kuwaiti dinar" },
              ]}
            />
            <AsyncCombobox
              id="sample-combobox"
              label="Asynchronous option example"
              value={selectedOption}
              onValueChange={setSelectedOption}
              options={[
                { value: "first", label: "Example option one" },
                { value: "second", label: "Example option two" },
              ]}
            />
            <TagList
              label="Example labels"
              tags={[
                { id: "sample-tag-a", label: "Example tag" },
                { id: "sample-tag-b", label: "Illustrative only" },
              ]}
            />
          </div>
        </Card>

        <Card title="Money and data table">
          <p>Illustrative amount with currency precision:</p>
          <p>
            <MoneyDisplay
              amount="123456789012345.67"
              currency="EUR"
              decimalPlaces={2}
              locale="en-US"
            />
          </p>
          <p>Example split row (illustrative only):</p>
          <ul
            className="gallery-split-list"
            aria-label="Illustrative transaction splits"
          >
            <SplitRow
              journalId="sample-journal-1"
              description="Example retained split"
              amount={{ amount: "12.34", currency: "EUR", decimalPlaces: 2 }}
            />
          </ul>
          <p>Zero-decimal and three-decimal examples:</p>
          <p>
            <MoneyDisplay
              amount="1250"
              currency="JPY"
              decimalPlaces={0}
              locale="en-US"
            />{" "}
            ·{" "}
            <MoneyDisplay
              amount="12.345"
              currency="KWD"
              decimalPlaces={3}
              locale="en-US"
            />
          </p>
          <SelectableTable
            caption="Illustrative rows"
            columns={[
              { key: "name", label: "Name" },
              { key: "detail", label: "Detail" },
            ]}
            rows={sampleRows}
            selectedIds={selectedRows}
            onSelectionChange={setSelectedRows}
          />
          <p aria-live="polite">{selectedRows.length} example rows selected</p>
          <ChartDataTable
            caption="Chart data equivalent (illustrative only)"
            columns={[
              { key: "period", label: "Period" },
              { key: "measure", label: "Measure" },
            ]}
            rows={sampleChartRows}
          />
          <Pagination page={page} pageCount={4} onPageChange={setPage} />
        </Card>

        <Card title="Tabs and persistent states">
          <Tabs
            tabs={[
              {
                id: "overview",
                label: "Overview",
                content: <p>Example content, available to keyboard users.</p>,
              },
              {
                id: "details",
                label: "Details",
                content: (
                  <p>Long example content stays readable on narrow screens.</p>
                ),
              },
            ]}
          />
          <div className="gallery-row">
            <Status>Loading example</Status>
            <Status kind="warning">Empty example</Status>
            <Status kind="error">Persistent error example</Status>
          </div>
        </Card>
      </div>

      <Dialog
        open={dialogOpen}
        title="Example dialog"
        onOpenChange={setDialogOpen}
      >
        <p>
          This dialog uses the browser dialog primitive for modal focus and
          Escape handling.
        </p>
        <Button type="button" tone="quiet" onClick={() => setDialogOpen(false)}>
          Close example
        </Button>
      </Dialog>
      <Dialog
        open={drawerOpen}
        title="Example drawer"
        drawer
        onOpenChange={setDrawerOpen}
      >
        <p>On narrow screens this surface becomes a bottom sheet.</p>
        <Button type="button" tone="quiet" onClick={() => setDrawerOpen(false)}>
          Close drawer
        </Button>
      </Dialog>
    </main>
  );
}
