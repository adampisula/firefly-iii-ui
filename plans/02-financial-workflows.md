# Plan 02 — Financial workflows

Canonical task table below. Common prerequisite **BASE = FND-04/05/06/07/08/10 done** (client/auth/shell/tests/runtime/primitives). This acronym is only shorthand for those explicit IDs; coverage validators must expand it. FND-08 must resolve/report capability boundaries against exactly Firefly III 6.7.9, not wait for forbidden backend extensions. Domain helpers may be developed with mocks earlier via an explicitly claimed child task, but supported slices require runtime proof before completion. Common write scope is `frontend/src/features/<domain>/`, corresponding domain routes, local tests and that task's inventory evidence in the separate `frontend/` git repository. No shared dependency, transport or navigation edits without coordination.

Every card requires: all source/API fields audited, supported list/detail/forms/actions reachable; loading/empty/error/permission/feature-disabled states; URL filters/pagination; accessible desktop/tablet/mobile behavior; successful mutations followed by authoritative refetch; runtime checks on disposable data; evidence and capability disposition for every assigned API/workflow row. API-REFERENCE and PARITY-GAPS supply source evidence. Use the accepted Next.js/React/TypeScript frontend, Firefly branding / Verdelo style and English-only UI; money/date formatting remains currency-aware.

**Immutable-backend and completion rule (applies to every card):** use only the official original Firefly image, exactly 6.7.9, and supported APIs or proven semantically equivalent API compositions. No backend/source changes, extensions, patches, plugins, custom backend image, scraping, backend-session proxy bypass or direct DB access. Split affected work into declared supported-slice and residual-gap child tasks with disjoint scope/evidence. A domain task may be `done` for an explicitly defined, runtime-tested supported slice after residual ownership/disposition is recorded; residual inventory rows stay unsupported/read-only/unverified, never verified by parent completion. Keep unavailable actions visible with an explanation (read-only context where available); a trusted backend UI handoff must be explicitly identified, not claimed as native frontend parity. Identity handoffs are approved; other missing financial functions are not silently scope-waived. FND-08 must investigate/report true impossibility and seek user choice for each unresolved financial boundary, without blocking independent supported work. Release reports scoped capabilities and residual gaps honestly, not full replacement.

## Status board

| ID | Task | Status | Depends on / gate | Owner/session | Updated UTC |
| --- | --- | --- | --- | --- | --- |
| CORE-01 | Search and all autocomplete families | ready | BASE | — | — |
| CORE-02 | Account lifecycle and liabilities | ready | BASE | — | — |
| CORE-03 | Transaction lists/detail and journal reads | blocked | BASE; CORE-02 | — | — |
| CORE-04 | Transaction editor, splits and deletion | blocked | BASE; CORE-02/03 | — | — |
| CORE-05 | Transaction links, clone/conversion and selection actions | blocked | CORE-04; FND-08 supported/residual split for GAP-06 | — | — |
| CORE-06 | Statement reconciliation | blocked | CORE-02/03/04; FND-08 GAP-02 disposition (no extensions) | — | — |
| CORE-07 | Budgets, period limits and available budgets | blocked | BASE; CORE-03 | — | — |
| CORE-08 | Subscriptions/bills | blocked | BASE; CORE-03; FND-08 GAP-06 rescan disposition | — | — |
| CORE-09 | Piggy banks and fund allocations | blocked | BASE; CORE-02/03; FND-08 GAP-06 disposition | — | — |
| CORE-10 | Categories, tags and object groups | blocked | BASE; CORE-03 | — | — |
| CORE-11 | Attachments throughout resource screens | blocked | BASE; CORE-03 | — | — |

## CORE-01 — Search and autocomplete

**Scope:** `features/search`, shared domain-independent autocomplete adapter (transport stays FND-04-owned), command-search result UI. Other domains compose its documented controls.

**Work**
- Implement account and transaction search with supported query syntax/help, query persistence, filters, result count and pagination. Keep special `/search/transactions/count` separate from full query total (different matching/summing semantics).
- Cover **all 15 autocomplete declarations**, including bills/subscriptions aliases, currencies/types, groups, recurrences, transaction metadata. Per-family parameters/types/limits/date restrictions come from actual controllers, not one assumed contract.
- Debounce/cancel stale queries, show match metadata and keyboard selection, distinguish choosing existing object from free-text creation where backend supports names. Ensure mobile search is reachable without desktop search box.

**Acceptance:** source-backed query/operator fixtures, empty/malformed/Unicode/tag/account results, out-of-order response cancellation, accessibility and paging tests. Original `query` survives backend-generated `search` page-link discrepancy. Special count doesn't masquerade as unique search total. Each autocomplete has contract coverage; aliases can share UI but not disappear from ledger.

## CORE-02 — Accounts and liabilities

**Scope:** `features/accounts`; align bootstrap write helper ownership with FND-06.

**Work**
- Asset, expense, revenue, liability account lists, inactive toggle, detail, date/all-time transactions, associated attachments/piggy banks, balances and charts. Type/role choices and writable metadata include all request fields and conditional requirements.
- Create/edit/delete accounts: opening balance/date, currency, asset role, credit-card payment fields, liability subtype/direction/interest and supported account identifiers/notes/virtual balance/include-net-worth flags. Audit exact schema rather than use this list as an exhaustive substitute.
- Deletion explains backend consequences/linked transactions; no assumed replacement-account API. Show eligibility-specific reconciliation entry (CORE-06) and related-domain panels without duplicated fetching/business logic.

**Acceptance:** CRUD and inactive lifecycle for every supported account type, liability/credit-card conditional validation, decimal/date boundaries, multi-currency balances and non-owner restrictions. Opening balance/date are paired. Existing transaction relation/detail remains correct after edits. No bank-issued card controls or actual payment claims.

## CORE-03 — Transaction lists, detail and journal identity

**Scope:** `features/transactions` read screens and read wrappers; agree file split with CORE-04 before later editor work.

**Work**
- Withdrawal/deposit/transfer/all lists, date/all-time modes, supported filters/sorts/pagination and selection state. Group and journal identities persist separately; splits must not duplicate totals or use group ID for a journal operation.
- Detail includes full split metadata, native/foreign/primary amounts, source/destination, classification, subscription, links, reconciled state, notes/location/URLs/date/reference fields, related attachments and piggy events. Link navigation uses CORE-05; component slots avoid blocking read screens on every related module.
- Journal read/deep link resolves containing group and selected split. Include audit-log parity under GAP-06 (not established via API); no fabricated endpoint.

**Acceptance:** all six assigned GET operations covered; group/journal/split deep links, deleted/missing/forbidden resources, large pagination and native-vs-converted totals verified. Detail retains all backend metadata. Audit-log workflow needs a tested supported API/composition; otherwise retain an explicit unsupported/read-only or identified trusted-backend-handoff residual under GAP-06. This does not block the supported transaction read slice or verify the audit-log row. Selections survive only appropriate paging/filter changes with explicit scope.

## CORE-04 — Safe transaction editing and deletion

**Scope:** `features/transactions` form/write modules and editor routes; coordinate with CORE-03's read files, no concurrent writes to same file.

**Work**
- Create withdrawal/deposit/transfer and splits; edit groups and split rows, group title, every optional request field/classification/foreign currency/date/reference/location, rule/webhook options, duplicate handling and attachment hooks. Positive amounts with type/direction, not negative amount guessing.
- Map Laravel indexed field errors to correct split and error summary; English UI with currency-aware decimal/date input, dependent account/currency selection, dirty navigation warning, keyboard add/remove/reorder where supported and mobile full-page editing.
- **PUT includes every retained split and its `transaction_journal_id`**; omissions intentionally delete. Omit immutable money/account fields for reconciled rows. Group vs individual journal delete is explicit with full impact confirmation.
- Refetch authoritative result after rules/webhooks; handle mutation that changes/deletes submitted transaction, frontend authentication expiry during edit and uncertain completion. No automatic retry, pretend success or sparse changed-splits payload.

**Acceptance:** create all three types, foreign amounts, multiple splits; change one split without losing siblings; add/remove splits with correct IDs; reconciled restrictions, duplicate detection, optional-field round trip and field-error focus tests. Concurrent stale edits are detected/reloaded where possible (do not claim unsupported version locks). POST/PUT and both delete operations verified on disposable data. Timeout/retry test proves no accidental duplicate posting.

## CORE-05 — Relationships and convenience/multi-selection workflows

**Scope:** `features/transaction-actions` and `features/link-types`; use editor's tested serializer, do not reimplement split PUT.

**Work**
- Link CRUD, link-type reads/related transactions, direction/reversal/unlink. Owner-only link-type create/edit/delete with safe deletion consequences.
- Clone and clone-and-edit, type conversion with exact account/type/reconciled restrictions; rule/recurrence-from-transaction launch data via AUTO tasks. Strip IDs/reconciled state/creation-only metadata appropriately from cloned payloads.
- Distinguish existing UI **mass edit**, **bulk editor**, **mass delete** and maintenance account-reassignment API. Each has its own input/affected-selection semantics. Use only proven supported API compositions; absent equivalence, retain a visible GAP-06 residual and obtain user choice through FND-08. Supported actions need preview count, selected scope, per-item progress, partial failures and safe resume.

**Acceptance:** full 11-operation relationship inventory; reverse link labels/IDs correct, permissions enforced by backend. Clone never retains destructive identity; conversion fixtures preserve accounting rules. Each UI selection-edit mode is either reproduced with verified semantics or explicitly classified as an unsupported residual, not replaced by narrow `/data/bulk/transactions`. Rule/webhook effects and partial failure/retry handling tested without duplicated journals; selection isn't assumed to include unselected pages. Supported relationship/action slice may complete independently; unresolved helper rows remain unverified with named residual tasks and FND-08/user disposition.

## CORE-06 — Statement reconciliation (GAP-02)

**Scope:** `features/reconciliation`; frontend only. Separate supported reconciliation reads/context from the residual full statement workflow under GAP-02; no additive backend files.

**Work**
- Establish whether a supported API/composition can reproduce the complete statement workflow before enabling submit. If impossible on immutable 6.7.9, expose read-only context and an explicit unsupported state or identified trusted backend handoff, report via FND-08 and seek user choice; do not invent a reconciliation endpoint or block independent account/transaction work.
- Where proven supported, dedicated workflow for eligible editable asset: statement start/end/opening/closing amounts, journal selection and previously reconciled context, exact discrepancy, positive/negative/zero correction decision and review/submit.
- Follow backend reconciliation account/type and period rules; selected journals marked consistently and optional correction transaction created according to old UI behavior. A plain transfer or `reconciled=true` toggle is not enough.
- Preserve checked journals over edit-and-return where safe; invalidate selections when account/date scope changes. Provide permitted unreconcile action and clear immutability warnings.

**Acceptance:** old/new results agree for zero/positive/negative mismatch, inclusive period edges, splits/transfers/foreign values, already reconciled/locked rows. Keyboard-only matching works on mobile and desktop. For supported submit, failed/interrupted execution does not duplicate corrective transactions or partially misstate success; API/composition must prove permission/isolation and transaction boundaries. GAP-02 cannot close on flag editing alone. If full reconciliation is unavailable, supported read/context slice can complete with explicit acceptance evidence; the full workflow row remains unsupported/unverified pending user choice, not verified by a backend UI link.

## CORE-07 — Budgets and available/period amounts

**Scope:** `features/budgets` and nested limits; shared detail transaction list consumes CORE-03.

**Work**
- Active/inactive budget list, CRUD/reorder, period selection, assigned/unassigned transactions, spending/attachments and budget-limit detail. Keep available-budget resources read-only unless runtime proves an existing supported 6.7.9 API contract.
- Limit list/create/show/edit/delete, cross-budget list and related transactions; currency/date/positive amount/duplicate period validation; all period types supported by backend, not monthly-only UI.
- Auto-budget none/reset/rollover/adjusted configuration and schedule/amount semantics, showing cron prerequisites and accurate progress/native-vs-primary data. Make reorder contract explicit (no assumed reorder endpoint).

**Acceptance:** all 17 operations; overlapping/mixed-period behavior, duplicate same-currency periods, same-day strictness, no-budget transaction route and currencies verified. Auto-budget values survive edits; fixture cron generates expected outcomes locally. No create/delete UI for unavailable `/available-budgets` routes. Accessible narrow-screen period-limit editing.

## CORE-08 — Subscriptions (bills)

**Scope:** `features/subscriptions`; one domain for bill/subscription aliases.

**Work**
- CRUD/list/detail, order/group, min/max amounts/currency, repeat/skip/lifecycle dates, active states and notes/attachments. Related rules/transactions and expected-versus-paid timeline, with backend authoritative data.
- Rescan matching transactions only using verified existing API/composition under GAP-06; otherwise show the unsupported action or identified trusted backend handoff and retain a separate residual for FND-08/user choice; don't confuse schedule with recurrence transaction generation. Launch rule-from-subscription via AUTO-01.
- Preserve canonical API path choice and explicit alias compatibility tests; parent groups integrate CORE-10 rather than invent standalone group creation.

**Acceptance:** 16 operation declarations covered incl aliases, range and frequency validation, no/partial/multiple expected payments, foreign/primary currency views, archived state and rescan effects. Where supported, repeated rescan doesn't duplicate/unintentionally rewrite matches; permissions and failure feedback verified. Supported CRUD/timeline slice may complete with rescan explicitly unsupported/unverified, not omitted or scope-waived. Not marketed as bill payment execution.

## CORE-09 — Piggy banks, allocations and events

**Scope:** `features/piggy-banks`.

**Work**
- CRUD, list/group/order/detail, target/dates/progress, multiple account allocations (`accounts[].account_id/current_amount`), related accounts/events/attachments and history chart/table.
- Add/remove reserved funds, reset history and transfer-associated piggy events only through verified existing API/composition under GAP-06; separate any unavailable action into a visible unsupported/read-only or identified trusted-backend-handoff residual for FND-08/user choice. Confirm fund constraints and event side effects; do not model this as real bank transfer or a single-account-only resource.
- Keyboard and touch amount allocation editor; native/primary currency explanation and consistent account balance/refetch behavior.

**Acceptance:** eight API operations plus full UI action coverage; multi-account allocations, insufficient funds, target and type/currency restrictions, positive/negative/zero events, resets and date/history boundaries checked against backend. Concurrent/ambiguous writes don't silently overreserve or duplicate events. Reset-history and any other unsupported event action remain unverified gaps, not removed requirements; supported CRUD/allocation slice may complete independently.

## CORE-10 — Categories, tags and object groups

**Scope:** `features/classification` (categories/tags), `features/object-groups`. Can split children by folder for parallel work.

**Work**
- Category/tag CRUD/list/detail, period/all-time transactions, uncategorized transactions and tag mass deletion. Handle supported notes/location/metadata and tag names-or-IDs correctly, including URL-encoding edge cases.
- Object-group list/detail/update/delete/reorder and associated piggy banks/subscriptions. No standalone create route; create/associate group only using supported resource semantics.
- Cross-domain pickers and transaction/refetch integration; label deletion/reassignment consequences and preserve distinct tags/categories/budgets concepts.

**Acceptance:** 20 operations, duplicate/Unicode/space/special-character tags and names, blank/unused/unassigned categories, deleted group relationship effects and ordering persistence verified. Read-only/non-owner users see valid actions only; mobile list/detail/action parity and keyboard picker flows.

## CORE-11 — Attachment lifecycle and shared integration

**Scope:** `features/attachments`, upload/download preview primitives and resource attachment adapters. Domain screens integrate documented adapter without editing shared code concurrently.

**Work**
- Global metadata list/detail/edit/delete, relevant resource associations, safe preview/download. Create metadata first, then raw binary upload, not multipart; expose transfer progress/cancel/error/retry/recovery and metadata-with-failed-content state.
- Use known backend limits/allowed object types; content type/filename sanitization, safe content disposition and no active HTML/SVG embedding by default. Authenticated downloads use transport's binary path.
- Integrate accounts, transactions, budgets, subscriptions, piggy banks, categories and tags according to available relation endpoints.

**Acceptance:** seven API operations and all applicable resource attachment workflows; empty/big/disallowed MIME/failed upload/404/deletion/cancel cases verified. No orphan cleanup assumed: prove allowed recovery or explain retained metadata. Preview cannot execute uploaded scripts; filename and body correct through the frontend transport in the separate-public-domain Compose deployment; no cross-domain cookies or token in download URLs.
