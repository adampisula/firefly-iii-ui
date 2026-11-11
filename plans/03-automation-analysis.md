# Plan 03 — Automation, dashboard and financial analysis

Canonical task state below. **BASE = FND-04/05/06/07/08/10 done.** Expand this shorthand when validating dependencies. Write scopes are domain feature folders/routes/tests and owned inventory evidence. Read README handoff/definition-of-done rules and API-REFERENCE/PARITY-GAPS. All state-changing actions require explicit user initiation and backend-authoritative results; tests use local sinks/disposable data. Use the accepted Next.js/React/TypeScript frontend with Firefly branding / Verdelo style and English-only UI; currency-aware money/date formatting remains required. `frontend/` is its own git repository.

**Capability boundary for every card:** target exactly Firefly III 6.7.9 using only the official original backend image and existing supported APIs/proven equivalent API compositions. No backend/source changes, extensions, patches, plugins, custom backend image, scraping, backend-session proxy bypass or direct DB access. FND-08 must resolve/report true API impossibility and seek user choice for missing financial workflows; a financial handoff/exclusion is not silently approved. Keep residual functions visible as unsupported, read-only where data exists, or explicitly identified trusted backend UI handoffs. Approved native identity handoffs are not deficiencies. Declare supported-slice and residual-gap children before implementation; supported tasks may finish with runtime evidence and explicit scope, while unsupported inventory rows remain unverified and owned. No entire supported domain waits for forbidden backend work; release is an honest scoped capability report, not a claim of full replacement.

## Status board

| ID | Task | Status | Depends on / gate | Owner/session | Updated UTC |
| --- | --- | --- | --- | --- | --- |
| AUTO-01 | Rule/group builder, testing and execution | done | BASE; CORE-03/04; FND-08 GAP-06 helper disposition | Kilo (deepseek agent) | 2026-11-11 20:58:00 UTC |
| AUTO-02 | Recurring transaction schedules and generation | done | BASE; CORE-04; FND-08 GAP-06 calendar/helper disposition | Kilo (deepseek agent) | 2026-11-11 20:55:17 UTC |
| AUTO-03 | Webhooks and delivery diagnostics | done | BASE; CORE-03 | Kilo (deepseek agent) | 2026-11-11 20:56:21 UTC |
| ANA-01 | Dashboard and all chart operations | done | BASE; CORE-02/03 | Kilo (deepseek agent) | 2026-11-11 20:51:32 UTC |
| ANA-02 | Insights across expenses, income and transfers | done | BASE; CORE-03 | Kilo (deepseek agent) | 2026-11-11 20:51:32 UTC |
| ANA-03 | Complete report builder and six report families | done | ANA-01/02; CORE-02/07/08/09/10; FND-08 GAP-03 supported/residual split | Kilo (deepseek agent) | 2026-11-11 21:16:00 UTC |

## AUTO-01 — Rules and rule groups

**Scope:** `frontend/src/features/rules/`; source-backed config-driven trigger/action selector. Domain wrapper may read configuration through shared API transport; SYS-08 owns configuration UI.

**Work**
- Rule/group list, CRUD, activation, strictness, order/move/group membership and duplication. Include trigger expressions/operators and action payloads, validation, stop-processing/default options and every currently supported trigger/action. Discover capabilities from configuration/source, not a partial hard-coded demo list.
- Build trigger/action editor with meaningful labels/descriptions, nested field errors and keyboard reordering alternative to drag. Create from subscription or journal only with proven GAP-06 existing-API equivalents and correct prefill/identities; otherwise expose a named unsupported helper residual without blocking supported rule editing.
- Expression validation; safe **test** with query/date/account scope and inspect matched transactions; distinguish saved-rule API testing from unsaved draft-test behavior, which needs proven existing-API equivalence or an explicit unsupported/read-only residual; never use execution as a substitute.
- Run single rule/group with explicit scope/match preview and warning about changes/deletions, show execution outcome and refresh affected transactions. Testing must never call trigger; triggering is not preview.

**Acceptance:** all 16 operations, source option/field inventory and helper workflows covered; zero/many matches, strict/non-strict/stop behavior, disabled/invalid expressions, destructive rule actions and group ordering verified. Test endpoint makes no mutations. Double-click/timeout doesn't unknowingly rerun action; no assumed cancellation/async status API. Supported rule-from-bill/journal, draft testing and duplicate semantics match default UI; unavailable helpers remain named unsupported/unverified residuals for FND-08/user choice, not blockers for the explicitly defined supported rule slice. Admin/administration permissions verified; mobile complex editor and screen-reader result summary work.

**Suggested children if needed:** `AUTO-01-a` rule/group CRUD + order; `-b` full builder/expression/test; `-c` execute/helpers. Add canonical child rows and disjoint files before parallel delegation.

## AUTO-02 — Recurrences and calendar behavior

**Scope:** `features/recurrences/`; compose transaction-template controls without sharing transaction editor's route/write ownership.

**Work**
- CRUD/list/detail/activation and all template transaction fields; repetitions/frequency/skip/weekend/finite/end/lifecycle options per actual request schema; rules/webhooks execution options and generated-transaction links.
- Calendar/schedule preview, events/suggestions and create-from-journal require a proven existing API/composition under GAP-06; otherwise keep each visible as an unsupported/read-only or identified trusted-backend-handoff residual and seek user choice through FND-08. Use backend scheduling semantics and timezone; do not implement a plausible generic recurrence engine and assume equivalence.
- Manual trigger chooses supported date and explains generation behavior; show generated groups. Distinguish schedule persistence from trigger behavior that restores latest-date state.
- Explain cron dependency and last-run outcomes where available, without inventing status API. No client polling that invokes cron or generates transactions during page load.

**Acceptance:** seven API operations plus UI helpers; monthly 28/29/30/31, leap year, weekend policies, skip/finite counts, start/end/DST and disabled schedules verified against available authoritative backend outcomes; calendar-output parity is claimed only where an existing API/composition proves it. If calendar helpers are unavailable, supported CRUD/generation can complete separately while their inventory rows remain unsupported/unverified. Trigger creates expected groups once per verified backend behavior; retries require state reconciliation, not assumed idempotency. Templates support foreign/split data only as backend allows (do not assume transaction editor schema equals recurrence schema). Keyboard/mobile schedule editing and preview alternatives.

## AUTO-03 — Webhooks and delivery operations

**Scope:** `features/webhooks/` including messages/attempts.

**Work**
- Feature-gated CRUD/list/detail with supported `triggers`, `responses`, `deliveries` **arrays** and current config enums; prohibit legacy singular schema in new payloads.
- Message queue/history list/detail/delete; delivery-attempt list/detail/delete with redacted response/error/timing; submit-ready and trigger-for-selected-transaction operations clearly separated.
- Mask sensitive URL/auth/header/payload data appropriately and avoid leaking financial payloads into console/telemetry. Deliberate actions warn about external network delivery and possible repeated downstream effects. No automatic resend on visit/retry.

**Acceptance:** all 13 operations; feature disabled/404, authorization, delivery failure/attempt history, deletion consequences, test local sink and explicit submission/trigger tested. No calls to real external endpoints in CI. Persisted array fields round trip, request validation maps visibly, diagnostics do not render untrusted response HTML. Mobile can access complete message/attempt data and destructive controls.

## ANA-01 — Overview and API charts

**Scope:** `features/dashboard/` and shared domain chart adapters; FND-10 owns chart primitives, domain calculations remain here.

**Work**
- Real summary panels: selected account balances/net worth, income/expense, subscriptions/left-to-spend, recent transactions and links to budget/goal detail. Reflect date range, administration, primary conversion and account preferences explicitly.
- Implement all five declared chart operations: balance (`/chart/balance/balance`), account overview, budget overview and with-limits, category overview. They need not all be crammed onto dashboard; expose appropriate detail views via reusable adapters.
- Use supplied glass/card/type layout with real data and accessible chart-table alternatives. Distinguish actual values from any backend projection; no simulated household/member/cards/payday notifications or unsupported forecasts. Keep each multi-currency series scoped/labeled.
- Per-panel loading/empty/error/permission state, bounded parallel queries, no stale-date race or all-history download. Configure onboarding-empty dashboard without redundant account creation.

**Acceptance:** all six assigned operations; figures agree with seeded backend for multiple currencies/conversion on/off, no accounts/no activity/negative balances/liabilities/transfers/splits. Zero differs from unavailable/null. Each chart has keyboard-readable equivalent data, meaningful legend and low-motion rendering. Visual baselines at desktop/tablet/mobile match design, not stock dashboard components. No duplicated sums across split/group or converted/native fields.

## ANA-02 — Full insight operation coverage

**Scope:** `features/insights/`; widgets/reports may consume exported adapters without duplicating requests.

**Work**
- Expense (13), income (7), transfer (6) aggregates: supported account/classification/total and unassigned families, including bill/subscription aliases. Preserve every meaningful scope and drill-through.
- Define discoverable analysis views/tabs integrated with reports/details; API-only aggregates may gain appropriate UI, but don't claim a current standalone default insights screen was established by audit.
- Currency-separated totals, native-vs-primary conversion labels, drill-through query construction and date/account/entity filter persistence. Reconcile distinction between linked relationships, no-budget/no-category/no-tag/no-bill data and true zero.

**Acceptance:** all 26 explicit operations have typed/runtime tests and reachable relevant analysis; aliases share UI and have compatibility tests. Expense/income/transfer fixtures include unassigned records, multiple tags and splits, deleted classifications, no activity and large ranges. Avoid double counting tag/account dimensions or summing unrelated currencies; every drill-through matches the source dataset. Chart/table and mobile access to all dimensions.

## ANA-03 — Report parity, not just charts (GAP-03)

**Scope:** `features/reports/`, frontend report-specific adapters and parity fixtures only; no additive backend wrappers. Declare supported report/builder children separately from residual unavailable family/output tasks.

**Work**
- Catalogue exact current visible tables, series, filters, sort/drill-through and report-info panels against web routes/controllers/views. Build field/series mapping only from existing supported APIs or proven equivalent compositions; source inspection is evidence, not permission to add JSON contracts or scrape rendered reports. Runtime confirm relative-date/all-object alias binders before adopting.
- Report builder with selected accounts, date range, budget/category/tag/counterparty scope and bookmarkable URLs. Assess **default, audit, budget, category, tag, double expense/revenue-account** families individually; implement supported outputs and keep unavailable families/outputs visibly unsupported/read-only or explicitly handed off to the trusted backend UI, with FND-08 report and user choice rather than silent omission.
- Include account/classification matrices, opening/closing/running balances, net worth, income/expense/subscription/budget statistics, top/average views and all report-specific outputs. Use shared insights/charts only when semantics match; no fetching only first page then calculating incomplete totals.
- Reports must reconcile split, transfer, liability, currency conversion, fiscal/timezone/inclusive date and unassigned cases. Use existing backend aggregation when all-history client calculations are unsafe/expensive; no second ledger implementation or new backend aggregation. If supported APIs cannot provide correct bounded results, record that output as a residual gap instead of guessing totals.

**Acceptance:** for each supported family/output, saved identical fixture scope produces old/new equivalent numbers, rows/series and drill-throughs; audit running balances correct at before/within/after boundaries. Multi-account transfer and multi-currency tests prevent double-counting. All documented aliases either runtime certified or explicitly gated, not silently promised. Accessible print/read views and chart-equivalent tables; large-range performance bounded and pagination/exports don't truncate. Every missing output remains an unsupported/unverified GAP-03 residual until existing-API evidence and tests close it. A declared, tested supported report slice can complete without waiting for impossible outputs, but chart-only dashboard cannot verify report parity or erase residuals. Final report lists supported families/outputs, explicit handoffs, limitations and pending user choices.

**Suggested children:** `ANA-03-a` catalogue/contracts + builder; `-b` default/audit; `-c` budget/category/tag; `-d` double and final equivalence. Declare status rows/write scopes before work; one report adapter per child and shared builder changes serialized.
