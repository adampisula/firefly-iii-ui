"use client";

import { useEffect } from "react";

const FIELD_HINTS: Record<string, string> = {
  "Account role":
    "The role a liability account plays, such as a credit card or loan.",
  "Account type": "Filter accounts by their Firefly account type.",
  Action: "The rule action Firefly executes when the trigger matches.",
  "Action expression":
    "Value passed to the selected rule action; meaning depends on the action.",
  "Administration title": "Display name for this Firefly administration.",
  Amount:
    "Decimal amount in the selected currency. Currency precision is preserved.",
  "API key":
    "Secret token for the AI provider. It is stored encrypted and never shown again.",
  "Asset role":
    "The role used for an asset account, such as default asset, savings or cash wallet.",
  "Asynchronous option example":
    "Example searchable option field used in the component gallery.",
  "Attach to": "The record type and ID that will own the uploaded attachment.",
  "Automatic amount":
    "Amount Firefly applies when it automatically resets or adjusts this budget.",
  "Automatic budget":
    "Let Firefly reset or adjust this budget automatically using the amount, currency and period below.",
  "Automatic currency": "Currency used by the automatic budget adjustment.",
  "Automatic period":
    "How often Firefly resets or adjusts the automatic budget amount.",
  "Background opacity":
    "How much of the scene shows through the main window. 100% is fully opaque.",
  "Balance or result date (optional)":
    "Restrict the lookup to balances or results on this dd/mm/yyyy date.",
  "Base URL":
    "OpenAI-compatible API base URL. Public and metadata network addresses are rejected.",
  Blocked: "Block this user from signing in to this Firefly administration.",
  Budget: "Optional budget attributed to the transaction or filter.",
  Category: "Optional category attributed to the transaction or filter.",
  Code: "Three-letter currency code, for example EUR or SEK.",
  "Configuration key": "Firefly configuration name to update.",
  "Convert all splits to":
    "Convert every split in this transaction group to the selected transaction type.",
  "Credit-card fields":
    "Bookkeeping metadata for a credit-card liability account.",
  Currency:
    "Currency used for amounts. Defaults to your Firefly primary currency where possible.",
  "Custom hex": "Enter a six-digit hex colour for a custom accent.",
  "Dashboard accounts": "Accounts included in dashboard summaries and charts.",
  "Data family": "The Firefly data family to export or maintain.",
  Date: "Calendar date in dd/mm/yyyy format. The value is sent to Firefly as YYYY-MM-DD.",
  "Date view range": "Default date range used by overview and analysis views.",
  "Decimal places (0–12)":
    "Maximum currency precision Firefly stores for this currency.",
  "Default reasoning effort":
    "Default thinking effort for new assistant requests.",
  Delivery: "How webhook deliveries are attempted and retried.",
  Description: "Human-readable description shown in lists and detail views.",
  Destination: "The item that will receive the link or conversion.",
  "Destination account":
    "Account that receives the money for this transaction.",
  Direction:
    "Whether the liability balance grows in the debit or credit direction.",
  Email: "Sign-in email address for the Firefly user.",
  End: "End of the period. The end date is inclusive.",
  "End date (optional)":
    "Optional last date for this record. Leave empty for no end.",
  "Entity ID": "Numeric Firefly identifier of the related record.",
  "Example name": "Example field used in the component gallery.",
  "Execution date": "Date on which this recurrence should next be executed.",
  "Extension date (optional)":
    "Optional date used to extend this bill's payment timeline.",
  "External URL": "Optional external link stored with the transaction.",
  File: "Local file to upload. The frontend does not inspect or alter the binary.",
  "First date": "First date on which the recurrence can create transactions.",
  "Fiscal year start": "Fiscal-year start in MM-DD form, for example 01-01.",
  "Foreign amount":
    "Optional amount in another currency. Provide the matching foreign currency too.",
  "Foreign currency": "Currency for the foreign amount.",
  "Formatting locale":
    "English regional formatting preference for money and dates.",
  Frequency: "How often the recurrence repeats.",
  From: "Source account, currency or range start, depending on the form.",
  "Glass frost":
    "Blur strength behind glass surfaces. Background opacity controls how much scene shows through.",
  "Group title (optional)":
    "Optional title for the transaction group shown in lists.",
  "History retention (days)":
    "How many days assistant conversations are kept locally.",
  "Inward description": "Label shown for the incoming side of this link type.",
  Insight: "The backend aggregate or insight to display.",
  "Interest period": "How often interest is applied to this liability account.",
  "Internal reference":
    "Optional internal reference stored with the transaction.",
  "Liability fields":
    "Bookkeeping metadata for a loan or other liability account.",
  "Liability type": "The kind of liability, such as a loan or debt.",
  "Link notes (optional)":
    "Optional note stored on the link between two records.",
  "Link type": "The direction-aware relationship used to connect records.",
  "List page size": "Number of rows requested per page in list views.",
  "Lookup family": "Entity family used for autocomplete lookup.",
  "Max output tokens":
    "Maximum response length requested from the AI provider.",
  "Maximum amount": "Upper amount bound for this filter or budget limit.",
  "Minimum amount": "Lower amount bound for this filter.",
  Model: "AI model used for assistant responses.",
  Moment:
    "When during the period the recurrence fires, for example start or end of month.",
  Name: "Short label you will recognise in lists and reports.",
  Notes: "Free-text notes stored with this record.",
  "Object group title":
    "Optional group used to organise related records. Firefly creates the group with the object.",
  Order: "Sort position; lower numbers appear first.",
  "Order (whole number)":
    "Sort position as a whole number; lower numbers appear first.",
  "Other journal ID": "The other journal involved in this link.",
  "Outward description": "Label shown for the outgoing side of this link type.",
  "Personal access token":
    "Firefly personal access token used only for this browser session. It is encrypted and never stored in the client bundle.",
  "Payment type":
    "How this subscription is paid, for example a transfer or standing order.",
  "Primary currency": "Firefly's primary currency for this administration.",
  Provider: "AI provider endpoint configuration used by the assistant.",
  Range: "Date range used for the insight aggregate.",
  Rate: "Exchange rate as a decimal value.",
  "Repeat until (optional)":
    "Optional last date on which the recurrence may run.",
  "Repetitions (optional)":
    "Optional maximum number of transactions to create.",
  "Replace binary":
    "Replace the existing attachment file instead of adding another one.",
  "Reserved account":
    "Asset account that holds this savings goal's bookkeeping allocation.",
  "Reserved amount":
    "Amount currently reserved from the selected account. This is bookkeeping, not a bank transfer.",
  Response: "HTTP response body Firefly sends for this webhook.",
  Role: "Permission role assigned to the user.",
  "Rule group": "Group that organises related rules.",
  "Rule moment": "When during the period the rule should run.",
  "Search field": "Account field used for this search.",
  Skip: "Number of matching occurrences to skip before acting.",
  "Skip count": "How many initial recurrences to skip.",
  Source: "Source account or value for this record.",
  "Source account": "Account that sends the money for this transaction.",
  Start: "Start of the period. The start date is inclusive.",
  "Start date": "Date the record becomes active, in dd/mm/yyyy format.",
  "Start date (optional)":
    "Optional first date for this record, in dd/mm/yyyy format.",
  "Subscription / bill":
    "Optional subscription or bill attributed to the transaction.",
  Symbol: "Currency symbol shown alongside formatted amounts.",
  Tag: "Optional tag applied to the record.",
  "Tags (comma separated)":
    "Comma-separated tags. Spaces around commas are ignored.",
  "Target amount":
    "Total you want to save, in the selected currency. Precision is preserved.",
  "Target date (optional)":
    "Optional date by which you want to reach the savings target.",
  Temperature:
    "Provider sampling temperature. Lower values are more deterministic.",
  Theme: "Light, dark or follow the operating-system theme.",
  "This journal is":
    "Whether this journal is the source or destination of the link.",
  Title: "Short title shown in lists and detail views.",
  To: "Destination account, currency or range end, depending on the form.",
  "Transaction query":
    "Firefly search grammar. Malformed clauses are reported, not guessed.",
  "Transaction type": "Withdrawal, deposit, transfer or opening balance.",
  Trigger: "Event that causes Firefly to run this rule or send this webhook.",
  Type: "Type or category for this record.",
  "Type DELETE": "Permanently delete the selected data family and its records.",
  "Type PURGE":
    "Remove unused or orphaned records from the selected data family.",
  URL: "Webhook endpoint URL that Firefly will call.",
  "Unused only": "Only include records that are not referenced by other data.",
  Value: "New configuration value.",
  "Write options":
    "Control how this write is applied. Nothing is changed until you submit.",
  "Start date / end date":
    "Dates are shown and entered as dd/mm/yyyy; Firefly receives YYYY-MM-DD.",
};

function normalizeLabel(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/:\s*\d+%$/, "")
    .replace(/\s*\(saved[^)]*\)\s*$/i, "")
    .replace(/\s*\*+$/, "")
    .trim();
}

function hintFor(label: string): string | undefined {
  if (FIELD_HINTS[label]) return FIELD_HINTS[label];
  const match = Object.keys(FIELD_HINTS)
    .filter((key) => label.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return match ? FIELD_HINTS[match] : undefined;
}

export function FieldHints() {
  useEffect(() => {
    const apply = () => {
      document
        .querySelectorAll<HTMLLabelElement>("label.field-label")
        .forEach((label) => {
          if (label.dataset.hintApplied) return;
          const hint = hintFor(normalizeLabel(label.textContent ?? ""));
          if (!hint) return;
          label.dataset.hintApplied = "true";
          label.dataset.hint = "";
          label.dataset.hintText = hint;
          label.setAttribute("aria-description", hint);
          label.control?.setAttribute("aria-description", hint);
        });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
