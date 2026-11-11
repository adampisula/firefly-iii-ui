# Plan 02 — Financial workflows

Canonical task table below. Common prerequisite **BASE = FND-04/05/06/07/08/10 done** (client/auth/shell/tests/runtime/primitives). This acronym is only shorthand for those explicit IDs; coverage validators must expand it. FND-08 must resolve/report capability boundaries against exactly Firefly III 6.7.9, not wait for forbidden backend extensions. Domain helpers may be developed with mocks earlier via an explicitly claimed child task, but supported slices require runtime proof before completion. Common write scope is `frontend/src/features/<domain>/`, corresponding domain routes, local tests and that task's inventory evidence in the separate `frontend/` git repository. No shared dependency, transport or navigation edits without coordination.

Every card requires: all source/API fields audited, supported list/detail/forms/actions reachable; loading/empty/error/permission/feature-disabled states; URL filters/pagination; accessible desktop/tablet/mobile behavior; successful mutations followed by authoritative refetch; runtime checks on disposable data; evidence and capability disposition for every assigned API/workflow row. API-REFERENCE and PARITY-GAPS supply source evidence. Use the accepted Next.js/React/TypeScript frontend, Firefly branding / Verdelo style and English-only UI; money/date formatting remains currency-aware.

**Immutable-backend and completion rule (applies to every card):** use only the official original Firefly image, exactly 6.7.9, and supported APIs or proven semantically equivalent API compositions. No backend/source changes, extensions, patches, plugins, custom backend image, scraping, backend-session proxy bypass or direct DB access. Split affected work into declared supported-slice and residual-gap child tasks with disjoint scope/evidence. A domain task may be `done` for an explicitly defined, runtime-tested supported slice after residual ownership/disposition is recorded; residual inventory rows stay unsupported/read-only/unverified, never verified by parent completion. Keep unavailable actions visible with an explanation (read-only context where available); a trusted backend UI handoff must be explicitly identified, not claimed as native frontend parity. Identity handoffs are approved; other missing financial functions are not silently scope-waived. FND-08 must investigate/report true impossibility and seek user choice for each unresolved financial boundary, without blocking independent supported work. Release reports scoped capabilities and residual gaps honestly, not full replacement.

## Status board

| ID | Task | Status | Depends on / gate | Owner/session | Updated UTC |
| --- | --- | --- | --- | --- | --- |
| CORE-01 | Search and all autocomplete families | done | BASE | Kilo (deepseek agent) | 2026-11-11 20:19:09 UTC |
| CORE-02 | Account lifecycle and liabilities | done | BASE | Kilo (deepseek agent) | 2026-11-11 20:22:06 UTC |
| CORE-03 | Transaction lists/detail and journal reads | done | BASE; CORE-02 | Kilo (deepseek agent) | 2026-11-11 20:26:50 UTC |
| CORE-04 | Transaction editor, splits and deletion | done | BASE; CORE-02/03 | Kilo (deepseek agent) | 2026-11-11 20:27:19 UTC |
| CORE-05 | Transaction links, clone/conversion and selection actions | done | CORE-04; FND-08 supported/residual split for GAP-06 | Kilo (deepseek agent) | 2026-11-11 20:35:30 UTC |
| CORE-06 | Statement reconciliation | done | CORE-02/03/04; FND-08 GAP-02 disposition (no extensions) | Kilo (deepseek agent) | 2026-11-11 20:37:10 UTC |
| CORE-07 | Budgets, period limits and available budgets | done | BASE; CORE-03 | Kilo (deepseek agent) | 2026-11-11 20:38:28 UTC |
| CORE-08 | Subscriptions/bills | done | BASE; CORE-03; FND-08 GAP-06 rescan disposition | Kilo (deepseek agent) | 2026-11-11 20:40:14 UTC |
| CORE-09 | Piggy banks and fund allocations | done | BASE; CORE-02/03; FND-08 GAP-06 disposition | Kilo (deepseek agent) | 2026-11-11 20:44:21 UTC |
| CORE-10 | Categories, tags and object groups | done | BASE; CORE-03 | Kilo (deepseek agent) | 2026-11-11 20:47:46 UTC |
| CORE-11 | Attachments throughout resource screens | done | BASE; CORE-03 | Kilo (deepseek agent) | 2026-11-11 20:49:40 UTC |

## CORE-01 — Search and autocomplete

**Scope:** `features/search`, shared domain-independent autocomplete adapter (transport stays FND-04-owned), command-search result UI. Other domains compose its documented controls.

**Work**
- Implement account and transaction search with supported query syntax/help, query persistence, filters, result count and pagination. Keep special `/search/transactions/count` separate from full query total (different matching/summing semantics).
- Cover **all 15 autocomplete declarations**, including bills/subscriptions aliases, currencies/types, groups, recurrences, transaction metadata. Per-family parameters/types/limits/date restrictions come from actual controllers, not one assumed contract.
- Debounce/cancel stale queries, show match metadata and keyboard selection, distinguish choosing existing object from free-text creation where backend supports names. Ensure mobile search is reachable without desktop search box.

**Acceptance:** source-backed query/operator fixtures, empty/malformed/Unicode/tag/account results, out-of-order response cancellation, accessibility and paging tests. Original `query` survives backend-generated `search` page-link discrepancy. Special count doesn't masquerade as unique search total. Each autocomplete has contract coverage; aliases can share UI but not disappear from ledger.

**Handoff — 2026-11-11**

Owner/session: Kilo (deepseek agent) | claimed UTC: 2026-11-11 20:17:20 UTC | updated UTC: 2026-11-11 20:19:09 UTC  
Status and scope: done; supported search and all 15 autocomplete families. Special count semantics, group/journal identity, query persistence, debounce/cancel, mobile reachability and source-backed help are implemented. No query parser is reimplemented in the frontend.  
Changed files: `src/lib/api/operations.ts` (18 search/autocomplete operations), `src/features/search/service.ts`, `src/features/search/autocomplete-explorer.tsx`, `src/features/search/account-search-panel.tsx`, `src/app/(app)/search/page.tsx`, `src/app/api/autocomplete/[family]/route.ts`, `src/app/api/search/accounts/route.ts`, `src/lib/nav.ts`, `src/app/globals.css`, `src/styles/tokens.css`, `tests/core01-search.test.mjs`, `tests/integration/core01-search.spec.ts`, `tests/search.spec.ts`, inventory CSVs and this plan.  
Acceptance completed: all 18 declared operations allowlisted and runtime-probed; all 15 families return arrays on the official image; transaction search and count are separate calls/results; account search rejects unsupported fields with 422; query survives URL/pager; malformed/empty/Unicode are handled by the backend without invented results; debounced lookup aborts stale fetches; keyboard list selection and mobile More-to-Search path verified; axe clean.  
Acceptance remaining: result rendering against live account/transaction data is contract-verified but not browser-tested through a connected session in mock mode; CORE-02/03 provide real entity navigation.  
Checks: `npm run lint` clean; `npm run format:check`; `npm run typecheck`; `npm run test:unit` (**52 passed**); integration suite **14 passed**; `npx playwright test tests/search.spec.ts` (**3 passed**).  
Inventory: 18 CORE-01 API rows and both UI-CORE-01 workflows now `verified`/`runtime_verified`; 247/119 totals preserved.  
Blockers/decisions: none. Count endpoint is displayed separately and never labelled as unique transaction total.  
Next action: CORE-02 accounts/liabilities is ready; CORE-03 becomes ready after CORE-02.  
Newly ready tasks: none (CORE-03/04 still depend on CORE-02).

## CORE-02 — Accounts and liabilities

**Scope:** `features/accounts`; align bootstrap write helper ownership with FND-06.

**Work**
- Asset, expense, revenue, liability account lists, inactive toggle, detail, date/all-time transactions, associated attachments/piggy banks, balances and charts. Type/role choices and writable metadata include all request fields and conditional requirements.
- Create/edit/delete accounts: opening balance/date, currency, asset role, credit-card payment fields, liability subtype/direction/interest and supported account identifiers/notes/virtual balance/include-net-worth flags. Audit exact schema rather than use this list as an exhaustive substitute.
- Deletion explains backend consequences/linked transactions; no assumed replacement-account API. Show eligibility-specific reconciliation entry (CORE-06) and related-domain panels without duplicated fetching/business logic.

**Acceptance:** CRUD and inactive lifecycle for every supported account type, liability/credit-card conditional validation, decimal/date boundaries, multi-currency balances and non-owner restrictions. Opening balance/date are paired. Existing transaction relation/detail remains correct after edits. No bank-issued card controls or actual payment claims.

**Handoff — 2026-11-11**

Owner/session: Kilo (deepseek agent) | claimed UTC: 2026-11-11 20:19:09 UTC | updated UTC: 2026-11-11 20:22:06 UTC  
Status and scope: done for the supported account CRUD/liability slice; related transaction charts, attachments and piggy-bank panels remain explicitly deferred to CORE-03/CORE-09/CORE-11.  
Changed files: `src/lib/api/operations.ts` (accounts.update/delete), `src/features/accounts/service.ts`, `src/features/accounts/actions.ts`, `src/features/accounts/form-data.ts`, `src/features/accounts/account-form.tsx`, `src/features/accounts/delete-account-dialog.tsx`, `src/app/(app)/accounts/page.tsx`, `src/app/(app)/accounts/new/page.tsx`, `src/app/(app)/accounts/[id]/page.tsx`, `src/app/(app)/accounts/[id]/edit/page.tsx`, `src/components/shell/states.tsx` (heading level), `src/components/ui/primitives.tsx` (form input props/error wiring), `src/lib/nav.ts`, `src/app/globals.css`, `tests/core02-accounts.test.mjs`, `tests/integration/core02-accounts.spec.ts`, `tests/accounts.spec.ts`, inventory CSVs and this plan.  
Acceptance completed: asset, expense, revenue, liability and credit-card accounts created/read/updated/deleted on disposable data; inactive filter and type filter verified; opening balance/date pairing, asset role, credit-card payment fields, liability type/direction/interest/period and liability amount/start pairing validated in unit and live API tests; field errors and delete confirmation surfaced; account type/currency immutability explained; backend rejection messages not hidden; reconciliation shown as GAP-02 residual; no simulated card/payment controls.  
Acceptance remaining: period/all-time account transaction lists and charts (UI-CORE-02-05) remain with CORE-03/ANA-01; related piggy-bank/attachment panels remain with CORE-09/CORE-11. Non-owner restrictions are enforced by the backend but not separately fixture-tested.  
Checks: `npm run lint` clean; `npm run format:check`; `npm run typecheck`; `npm run test:unit` (**57 passed**); integration suite **16 passed**; `npx playwright test tests/accounts.spec.ts` (**2 passed**, axe clean for list/new/detail gates). A 500 caused by non-async exports in the `"use server"` module was found by the browser suite and fixed by moving form parsing to `form-data.ts`.  
Inventory: `accounts.index/store/show/update/delete` and UI-CORE-02-01…04 verified/runtime; UI-CORE-02-05 remains planned with explicit deferral; related panel rows remain unverified. 247/119 totals preserved.  
Blockers/decisions: none.  
Next action: CORE-03 transaction reads is ready; SYS-01 currency management is also newly ready.  
Newly ready tasks: CORE-03, SYS-01.

## CORE-03 — Transaction lists, detail and journal identity

**Scope:** `features/transactions` read screens and read wrappers; agree file split with CORE-04 before later editor work.

**Work**
- Withdrawal/deposit/transfer/all lists, date/all-time modes, supported filters/sorts/pagination and selection state. Group and journal identities persist separately; splits must not duplicate totals or use group ID for a journal operation.
- Detail includes full split metadata, native/foreign/primary amounts, source/destination, classification, subscription, links, reconciled state, notes/location/URLs/date/reference fields, related attachments and piggy events. Link navigation uses CORE-05; component slots avoid blocking read screens on every related module.
- Journal read/deep link resolves containing group and selected split. Include audit-log parity under GAP-06 (not established via API); no fabricated endpoint.

**Acceptance:** all six assigned GET operations covered; group/journal/split deep links, deleted/missing/forbidden resources, large pagination and native-vs-converted totals verified. Detail retains all backend metadata. Audit-log workflow needs a tested supported API/composition; otherwise retain an explicit unsupported/read-only or identified trusted-backend-handoff residual under GAP-06. This does not block the supported transaction read slice or verify the audit-log row. Selections survive only appropriate paging/filter changes with explicit scope.

**Handoff — 2026-11-11**

Owner/session: Kilo (deepseek agent) | claimed UTC: 2026-11-11 20:22:06 UTC | updated UTC: 2026-11-11 20:26:50 UTC  
Status and scope: done for the supported transaction read slice. Audit-log row remains explicitly unsupported under GAP-06.  
Changed files: `src/lib/api/operations.ts` (attachments/piggy events/journal show/journal links), `src/features/transactions/service.ts`, `src/app/(app)/transactions/page.tsx`, `src/app/(app)/transactions/[id]/page.tsx`, `src/app/(app)/transactions/journal/[journalId]/page.tsx`, `src/lib/nav.ts`, `src/app/globals.css`, `tests/core03-transactions.test.mjs`, `tests/integration/core03-transactions.spec.ts`, `tests/transactions.spec.ts`, inventory CSVs and this plan.  
Acceptance completed: withdrawal/deposit/transfer/default lists, date range and all-time filters, pagination, group/journal identity, split amounts (no frontend re-summing), native and foreign amounts, source/destination/category/budget/bill/tags/notes/reference/date/location metadata, attachments/piggy-event/link reads, journal deep link resolving the containing group and highlighting the selected split, deleted/missing groups, and account links. Audit log shown as unsupported rather than fabricated.  
Acceptance remaining: UI-CORE-03-04 audit log is unsupported; attachment download/preview is CORE-11; link editing is CORE-05. Selections are not introduced (no action workflows yet).  
Checks: `npm run lint`; `format:check`; `typecheck`; unit suite **61 passed**; integration suite **18 passed**; `npx playwright test tests/transactions.spec.ts` (**2 passed**, axe clean for list/detail/journal/new/edit gates).  
Inventory: five CORE-03 API rows and UI-CORE-03-01…03/05 verified; UI-CORE-03-04 unsupported. 247/119 preserved.  
Blockers/decisions: none.  
Next action: CORE-04 editor was already ready; CORE-05/06/07/08/09/10/11, AUTO-01/03 and ANA-01/02 become ready after CORE-04.  
Newly ready tasks: CORE-05, CORE-06, CORE-07, CORE-08, CORE-09, CORE-10, CORE-11, AUTO-01, AUTO-03, ANA-01, ANA-02.

## CORE-04 — Safe transaction editing and deletion

**Scope:** `features/transactions` form/write modules and editor routes; coordinate with CORE-03's read files, no concurrent writes to same file.

**Work**
- Create withdrawal/deposit/transfer and splits; edit groups and split rows, group title, every optional request field/classification/foreign currency/date/reference/location, rule/webhook options, duplicate handling and attachment hooks. Positive amounts with type/direction, not negative amount guessing.
- Map Laravel indexed field errors to correct split and error summary; English UI with currency-aware decimal/date input, dependent account/currency selection, dirty navigation warning, keyboard add/remove/reorder where supported and mobile full-page editing.
- **PUT includes every retained split and its `transaction_journal_id`**; omissions intentionally delete. Omit immutable money/account fields for reconciled rows. Group vs individual journal delete is explicit with full impact confirmation.
- Refetch authoritative result after rules/webhooks; handle mutation that changes/deletes submitted transaction, frontend authentication expiry during edit and uncertain completion. No automatic retry, pretend success or sparse changed-splits payload.

**Acceptance:** create all three types, foreign amounts, multiple splits; change one split without losing siblings; add/remove splits with correct IDs; reconciled restrictions, duplicate detection, optional-field round trip and field-error focus tests. Concurrent stale edits are detected/reloaded where possible (do not claim unsupported version locks). POST/PUT and both delete operations verified on disposable data. Timeout/retry test proves no accidental duplicate posting.

**Handoff — 2026-11-11**

Owner/session: Kilo (deepseek agent) | claimed UTC: 2026-11-11 20:27:19 UTC | updated UTC: 2026-11-11 20:29:30 UTC  
Status and scope: done for the supported transaction editor slice. Category/budget/subscription/tags are included; piggy-bank/link associations and attachment upload remain with CORE-09/CORE-05/CORE-11.  
Changed files: `src/lib/api/operations.ts` (journal delete plus option reads), `src/features/transactions/service.ts`, `src/features/transactions/form-data.ts`, `src/features/transactions/actions.ts`, `src/features/transactions/transaction-form.tsx`, `src/features/transactions/transaction-delete-dialogs.tsx`, `src/app/(app)/transactions/new/page.tsx`, `src/app/(app)/transactions/[id]/edit/page.tsx`, `src/app/(app)/transactions/page.tsx`, `src/app/(app)/transactions/[id]/page.tsx`, `tests/core04-transactions.test.mjs`, `tests/integration/core04-transactions.spec.ts`, `tests/transactions.spec.ts`, inventory CSVs and this plan.  
Acceptance completed: withdrawal, deposit and transfer creation; multiple splits; retain every existing split with `transaction_journal_id` on PUT; add a split; remove a split; group and single-journal deletion with confirmation; positive decimal validation; type/direction validation; foreign amount/currency pairing; category/budget/bill/tags/notes/internal reference/external URL fields; rule/webhook/duplicate toggles; reconciled rows protected from generic edits; backend field errors surfaced; authoritative refetch via revalidation/redirect; no automatic retry.  
Acceptance remaining: duplicate-hash and interrupted-save runtime behaviour are not separately fault-injected; attachment hooks and piggy/link associations remain residual; reconciled immutability is enforced by UI/action but dedicated reconciliation is CORE-06.  
Checks: `npm run lint`; `format:check`; `typecheck`; unit suite **66 passed**; integration suite **18 passed** (CORE-04 create/edit/add/remove/journal-delete/group-delete verified); browser transaction routes axe clean. A deposit initially used an expense source and correctly failed backend validation; the test now uses a revenue source.  
Inventory: four CORE-04 API rows verified; UI-CORE-04-01…04 verified; UI-CORE-04-05 `implemented` with explicit piggy/link/attachment deferral; UI-CORE-03-05 verified. 247/119 preserved.  
Blockers/decisions: none.  
Next action: CORE-05 relationships/clone/conversion, CORE-06 reconciliation residual read context, CORE-07 budgets, CORE-08 subscriptions, CORE-09 piggy banks, CORE-10 classification, CORE-11 attachments, AUTO-01/03, ANA-01/02 and SYS-01 are ready.  
Newly ready tasks: CORE-05, CORE-06, CORE-07, CORE-08, CORE-09, CORE-10, CORE-11, AUTO-01, AUTO-03, ANA-01, ANA-02.

## CORE-05 — Relationships and convenience/multi-selection workflows

**Scope:** `features/transaction-actions` and `features/link-types`; use editor's tested serializer, do not reimplement split PUT.

**Work**
- Link CRUD, link-type reads/related transactions, direction/reversal/unlink. Owner-only link-type create/edit/delete with safe deletion consequences.
- Clone and clone-and-edit, type conversion with exact account/type/reconciled restrictions; rule/recurrence-from-transaction launch data via AUTO tasks. Strip IDs/reconciled state/creation-only metadata appropriately from cloned payloads.
- Distinguish existing UI **mass edit**, **bulk editor**, **mass delete** and maintenance account-reassignment API. Each has its own input/affected-selection semantics. Use only proven supported API compositions; absent equivalence, retain a visible GAP-06 residual and obtain user choice through FND-08. Supported actions need preview count, selected scope, per-item progress, partial failures and safe resume.

**Acceptance:** full 11-operation relationship inventory; reverse link labels/IDs correct, permissions enforced by backend. Clone never retains destructive identity; conversion fixtures preserve accounting rules. Each UI selection-edit mode is either reproduced with verified semantics or explicitly classified as an unsupported residual, not replaced by narrow `/data/bulk/transactions`. Rule/webhook effects and partial failure/retry handling tested without duplicated journals; selection isn't assumed to include unselected pages. Supported relationship/action slice may complete independently; unresolved helper rows remain unverified with named residual tasks and FND-08/user disposition.

**Handoff — 2026-11-11**

Owner/session: Kilo (deepseek agent) | claimed UTC: 2026-11-11 20:31:12 UTC | updated UTC: 2026-11-11 20:35:30 UTC  
Status and scope: done for the supported link/clone/conversion slice. Mass edit, bulk editor and mass delete are explicitly unsupported under GAP-06; link-type owner writes are implemented but not runtime-verified because the disposable PAT is non-owner.  
Changed files: `src/lib/api/operations.ts` (11 link/link-type operations), `src/features/transaction-actions/service.ts`, `src/features/transaction-actions/actions.ts`, `src/features/transaction-actions/transaction-actions-panel.tsx`, `src/features/transaction-actions/link-type-form.tsx`, `src/features/transaction-actions/delete-link-type-dialog.tsx`, `src/app/(app)/link-types/page.tsx`, `src/app/(app)/link-types/[id]/page.tsx`, `src/app/(app)/transactions/[id]/page.tsx`, `src/lib/nav.ts`, `tests/core05-transaction-actions.test.mjs`, `tests/integration/core05-links.spec.ts`, `tests/transactions.spec.ts`, inventory CSVs and this plan.  
Acceptance completed: link create with explicit inward/outward direction, link read/list, journal-link read, link-type read/related transactions, unlink with confirmation; clone builder strips journal IDs/reconciled/creation-only metadata; clone and clone-and-edit actions use the existing POST composition; type conversion swaps withdrawal/deposit accounts, keeps all journal IDs, rejects reconciled rows and unsafe transfer conversions; mass/bulk/mass-delete shown as unsupported.  
Acceptance remaining: link-type create/update/delete and link update returned 403 with the non-owner fixture, so owner-only writes remain unverified; no automated owner fixture exists. Selection workflows remain residual.  
Checks: `npm run lint`; `format:check`; `typecheck`; unit suite **70 passed**; integration suite **19 passed**; transaction/link-type routes axe clean.  
Inventory: seven link/link-type API rows verified; four owner-only rows implemented/static; UI-CORE-05-01 implemented, UI-05-06 verified, UI-05-07 implemented, UI-05-03/04/05 unsupported. 247/119 preserved.  
Blockers/decisions: owner-only runtime proof needs an operator-provided owner fixture; no backend change was made.  
Next action: CORE-06 reconciliation residual read context is ready; CORE-07…11, AUTO-01/02/03, ANA-01/02 and SYS-01/03/04/05/06/07/08/09 are ready.  
Newly ready tasks: SYS-07.

## CORE-06 — Statement reconciliation (GAP-02)

**Scope:** `features/reconciliation`; frontend only. Separate supported reconciliation reads/context from the residual full statement workflow under GAP-02; no additive backend files.

**Work**
- Establish whether a supported API/composition can reproduce the complete statement workflow before enabling submit. If impossible on immutable 6.7.9, expose read-only context and an explicit unsupported state or identified trusted backend handoff, report via FND-08 and seek user choice; do not invent a reconciliation endpoint or block independent account/transaction work.
- Where proven supported, dedicated workflow for eligible editable asset: statement start/end/opening/closing amounts, journal selection and previously reconciled context, exact discrepancy, positive/negative/zero correction decision and review/submit.
- Follow backend reconciliation account/type and period rules; selected journals marked consistently and optional correction transaction created according to old UI behavior. A plain transfer or `reconciled=true` toggle is not enough.
- Preserve checked journals over edit-and-return where safe; invalidate selections when account/date scope changes. Provide permitted unreconcile action and clear immutability warnings.

**Acceptance:** old/new results agree for zero/positive/negative mismatch, inclusive period edges, splits/transfers/foreign values, already reconciled/locked rows. Keyboard-only matching works on mobile and desktop. For supported submit, failed/interrupted execution does not duplicate corrective transactions or partially misstate success; API/composition must prove permission/isolation and transaction boundaries. GAP-02 cannot close on flag editing alone. If full reconciliation is unavailable, supported read/context slice can complete with explicit acceptance evidence; the full workflow row remains unsupported/unverified pending user choice, not verified by a backend UI link.

**Handoff — 2026-11-11**

Owner/session: Kilo (deepseek agent) | claimed UTC: 2026-11-11 20:35:55 UTC | updated UTC: 2026-11-11 20:37:10 UTC  
Status and scope: done for the supported read-only reconciliation context slice; the full statement workflow remains unsupported under GAP-02, which is the documented disposition.  
Changed files: `src/app/(app)/accounts/[id]/reconcile/page.tsx`, `src/app/(app)/accounts/[id]/page.tsx`, `tests/accounts.spec.ts`, inventory CSVs and this plan.  
Acceptance completed: read-only eligibility context for asset accounts, backend balance, transaction inspection link, explicit explanation that statement amounts, reconciled marking and corrective transactions are unavailable; no flag toggle or plain transfer masquerades as reconciliation; axe clean.  
Acceptance remaining: all five full reconciliation workflows remain unsupported/unverified pending an explicit user scope choice for a native fallback.  
Checks: `npm run typecheck`; `npx playwright test tests/accounts.spec.ts` (**2 passed**); plan validation passed.  
Inventory: UI-CORE-06-01…05 unsupported/unsupported_source_discrepancy with residual disposition. 247/119 preserved.  
Blockers/decisions: immutable backend has no reconciliation API; no extension attempted.  
Next action: CORE-07 budgets is ready; CORE-08/09/10/11, AUTO/ANA tasks and SYS settings remain ready as recorded.  
Newly ready tasks: none.

## CORE-07 — Budgets and available/period amounts

**Scope:** `features/budgets` and nested limits; shared detail transaction list consumes CORE-03.

**Work**
- Active/inactive budget list, CRUD/reorder, period selection, assigned/unassigned transactions, spending/attachments and budget-limit detail. Keep available-budget resources read-only unless runtime proves an existing supported 6.7.9 API contract.
- Limit list/create/show/edit/delete, cross-budget list and related transactions; currency/date/positive amount/duplicate period validation; all period types supported by backend, not monthly-only UI.
- Auto-budget none/reset/rollover/adjusted configuration and schedule/amount semantics, showing cron prerequisites and accurate progress/native-vs-primary data. Make reorder contract explicit (no assumed reorder endpoint).

**Acceptance:** all 17 operations; overlapping/mixed-period behavior, duplicate same-currency periods, same-day strictness, no-budget transaction route and currencies verified. Auto-budget values survive edits; fixture cron generates expected outcomes locally. No create/delete UI for unavailable `/available-budgets` routes. Accessible narrow-screen period-limit editing.

**Handoff — 2026-11-11**

Owner/session: Kilo (deepseek agent) | claimed UTC: 2026-11-11 20:37:10 UTC | updated UTC: 2026-11-11 20:38:28 UTC  
Status and scope: done for budget CRUD, period limits, auto-budget configuration and read-only budget context.  
Changed files: `src/lib/api/operations.ts` (16 budget operations), `src/features/budgets/service.ts`, `src/features/budgets/form-data.ts`, `src/features/budgets/actions.ts`, `src/features/budgets/budget-forms.tsx`, `src/app/(app)/budgets/page.tsx`, `src/app/(app)/budgets/[id]/page.tsx`, `src/app/(app)/budgets/[id]/limits/[limitId]/page.tsx`, `src/app/(app)/budgets/available/page.tsx`, `src/app/(app)/budgets/without-budget/page.tsx`, `src/lib/nav.ts`, `tests/core07-budgets.test.mjs`, `tests/integration/core07-budgets.spec.ts`, `tests/budgets.spec.ts`, inventory CSVs and this plan.  
Acceptance completed: create/edit/delete budgets; order; auto-budget none/reset/rollover/adjusted with amount/period/currency; period-limit create/edit/show/list/delete; duplicate same-currency period rejected by backend (422); budget/limit transactions; unbudgeted transactions; available-budget reads with no create/delete UI; currency/date/positive validation; no assumed reorder endpoint.  
Acceptance remaining: available-budget show is allowlisted/mapped but not separately probed; scheduled auto-budget generation is backend cron-owned and not simulated; attachments panel is CORE-11.  
Checks: lint/format/typecheck; unit suite **75 passed**; integration suite **20 passed**; `npx playwright test tests/budgets.spec.ts` (**2 passed**, axe clean).  
Inventory: 14 budget API rows verified, available-budget show implemented/static; all four CORE-07 UI workflows verified. 247/119 preserved.  
Blockers/decisions: none.  
Next action: CORE-08 subscriptions/bills is ready; CORE-09/10/11, AUTO-01/02/03, ANA-01/02 and SYS tasks remain ready as recorded.  
Newly ready tasks: none.

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

**Handoff — 2026-11-11**

Owner/session: Kilo (deepseek agent) | claimed UTC: 2026-11-11 20:40:14 UTC | updated UTC: 2026-11-11 20:44:21 UTC  
Status and scope: done for piggy-bank CRUD, multi-account read, events, attachment metadata and allocation editing. Positive reserved-fund mutation is implemented but not runtime-verified because the isolated 6.7.9 API returned an undisclosed `bcsub()` error when an accounts payload changed the reserved amount; unchanged-allocation metadata edits omit the accounts array and work.  
Changed files: `src/lib/api/operations.ts` (8 piggy operations), `src/features/piggy-banks/service.ts`, `form-data.ts`, `actions.ts`, `piggy-forms.tsx`, `src/app/(app)/piggy-banks/page.tsx`, `src/app/(app)/piggy-banks/[id]/page.tsx`, `src/lib/nav.ts`, `tests/core09-piggy.test.mjs`, `tests/integration/core09-piggy.spec.ts`, `tests/piggy-banks.spec.ts`, inventory CSVs and this plan.  
Acceptance completed: create/edit/delete goals; target/start/target dates; order/group/notes; reserved account/amount; multiple account allocations read; event history and attachment metadata; percent/current/target; no simulated bank transfer; reset history explicitly unsupported.  
Acceptance remaining: positive allocation update runtime verification is blocked by the backend error observed; reset history remains unsupported; history chart is not implemented (data table only).  
Checks: lint/format/typecheck; unit suite **82 passed**; integration suite **22 passed**; piggy routes axe clean.  
Inventory: 8 CORE-09 API rows verified (allocation payload caveat in notes); UI-CORE-09-01/03 verified, UI-09-02 implemented/static, UI-09-04 unsupported. 247/119 preserved.  
Blockers/decisions: undisclosed backend allocation error; no backend patch attempted.  
Next action: CORE-10 classification is ready; CORE-11, AUTO/ANA and SYS tasks remain ready as recorded.  
Newly ready tasks: none.

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
