# UI workflow parity: gaps and source-backed planning constraints

## Contract and verification boundary

- Inventory: `firefly/frontend/plans/inventory/ui-workflows.csv` in the frontend Git repository (`frontend/plans`). Stable workflow IDs identify user tasks, not individual legacy JSON/chart routes. At the 2026-11-11 planning snapshot every row is **planned**, not implemented or runtime verified; implementing agents must update progress/evidence under the canonical task protocol. Do not renumber existing IDs when adding workflows.
- Columns: `workflow_id`, `area`, `workflow`, `source` (project-relative evidence with line ranges), `api_mapping_or_gap`, `task_id`, `status`, `notes`, `disposition`, `disposition_reason`. Disposition describes the planned delivery boundary, not completion or verification. Semicolon-separated references are multiple evidence points or mappings. API families/wildcards are mapping hints, not new route declarations; `{id}` stands for the appropriate resource binder. Exact methods/paths belong to `firefly/frontend/plans/inventory/api-operations.csv` and `firefly/frontend/plans/API-REFERENCE.md`.
- Task ownership is reconciled across both inventories: CORE-03 = transaction list/detail and group/journal GET operations (six); CORE-04 = editor/splits and group/journal writes/deletes (four); CORE-05 = clone/conversion/mass/bulk/links and link types; CORE-06 = reconciliation. SYS-09 now owns notification workflows (a dedicated task split from SYS-03/04/05); its CSV rows are aligned accordingly.
- Stable workflow IDs retain their original prefixes when ownership changes: transaction group deletion `UI-CORE-03-05` is owned by CORE-04; personal CLI-token lifecycle `UI-SYS-08-01` by SYS-04; notification rows `UI-SYS-04-12/13` and `UI-SYS-05-05` by SYS-09. Source identifiers are not renamed to reflect task reassignment.
- Inspected default web routes, controllers, Blade views, active v3 and referenced v1 scripts, docs navigation and selected financial/operational docs. Evidence is static. Routed or referenced behavior is not proof that a migration-era page works in a browser.
- No frontend/backend implementation, dependency installation, migrations, cron requests, notification tests, destructive actions, or application builds/tests were performed. Backend `agents.md:1-11` was read; commit/PR metadata instructions do not apply to these uncommitted planning artifacts.

**Final product boundary:** Next.js / React / TypeScript frontend; separate frontend and backend domains in the same Compose deployment. Use only the official, original Firefly III Docker image pinned to exact backend **6.7.9** and an immutable image digest (record the actual resolved digest before deployment; do not invent one). No source/backend modifications, extensions, plugins, custom backend images, direct database access, authorization bypasses, or scraping. Source inspection is evidence only, not permission to build or patch the backend.

**Identity handoffs are approved, financial fallbacks are not.** PAT and native OAuth are accepted. Leave native login/logout, registration/invite acceptance, reset, MFA, profile/security, OAuth-client/PAT lifecycle and CLI-token screens on the trusted backend; do not rebuild identity. Store API credentials, OAuth secrets and tokens only server-side in the frontend, isolated by per-user frontend sessions. No broad backend HTTP-session bridge, cookie relay, iframe integration or web-form automation. A tested native identity handoff can close its scoped acceptance criteria; approval alone does not make it implemented or verified. Financial old-UI links, external tools and manual procedures are not full native financial parity and are not pre-approved scope reductions.

Workflow dispositions:
- `api_supported`: a source-backed API mapping exists; runtime contracts and frontend acceptance still need tests.
- `approved_native_identity_handoff`: approved identity/security boundary; safe linkage, user context and lifecycle tests remain planned.
- `requires_contract_verification`: candidate API composition or side effects are not established; no invented routes or web-session substitute.
- `residual_unsupported_scope_choice`: no equivalent supported contract is established under the immutable boundary; retain the limitation and any handoff proposal for transparent user scope choice, not silent waiver.
- `external_tool` / `operational_guidance`: separate product or operator procedure, not native financial parity or permission for frontend DB/CLI access.
- `historical_source_english_only`: retain historical language/locale evidence without requiring multilingual or RTL delivery.

Canonical task claims/write scopes govern updates to README, architecture, foundations, design and master prompt. No permanent session-specific owner is assigned to these documents; serialize shared edits and record transfers.

## Gap register

All seven gaps remain planned and unverified. GAP-01 has an approved native identity-handoff disposition, not an obligation to rebuild identity. Other gaps distinguish provable API composition from residual unsupported behavior. Backend extensions are forbidden, not a pending permission option; unsupported financial behavior must stay visible until an explicit user scope decision is recorded.

### GAP-01 — Authentication, profile, OAuth and browser session

**Owners:** FND-05 (per-user frontend auth/session) and SYS-04 (trusted native profile/security/client/token handoffs); FND-08-a verifies PAT/native OAuth against the unchanged official 6.7.9 image before FND-05; FND-08-b records remaining supported contracts and residual gaps. FND-06 provides the authenticated shell, not an identity authority.

Current workflows include login/logout, registration/invite acceptance, password reset, email change/confirmation/undo, password change, own-account deletion, other-session invalidation, MFA enrollment/challenge/disable/recovery, PAT lifecycle, OAuth client lifecycle/secret regeneration, external-client authorization, and command-line-token regeneration.

Evidence:
- `firefly/firefly-iii/routes/web.php:32-67,116-159,859-900`.
- `firefly/firefly-iii/app/Http/Controllers/ProfileController.php:80-95,111-123,170-181`: internal versus external identity; demo restrictions.
- `firefly/firefly-iii/app/Http/Controllers/Profile/MfaController.php:83-126,187-224`: backup-code and enrollment screens.
- `firefly/firefly-iii/resources/views/profile/index.blade.php:37-88`: self-service actions and distinct command-line token.

Ordinary v1 API access is Passport bearer authentication. Owner `/users` CRUD is **not** self-service profile parity. Web OAuth routes use full-auth/MFA middleware; Passport package routes must be inventoried from an installed runtime rather than guessed. API reference records CORS with credentialed requests disabled; use server-side bearer calls and independent frontend sessions across the separate domains, not shared browser sessions (`firefly/frontend/plans/API-REFERENCE.md`, Authentication, authorization, and deployment).

**Closure:** test PAT connection and native OAuth using installed-runtime contracts, server-side secrets and isolated per-user frontend sessions. Test trusted backend links with the intended user context (never assume backend and frontend sessions identify the same user); allowlist destinations/return links and reject open redirects. Native identity screens remain on the backend, with backend CSRF/MFA enforcement; verify blocked/unactivated/partial-MFA/external-identity, reset/confirmation, revocation, one-time secret display and logout/disconnect behavior. No credential/token-bearing handoff URLs or leakage into browser storage, logs or referrers. OAuth protocol codes/state and native one-time reset/invitation links must use their native validated flow with redacted callbacks; never append API/CLI tokens to links. A tested approved native identity handoff is valid scoped closure, not a financial-parity exception. All corresponding inventory rows stay planned now.

**Runtime classification (FND-08-b, 2026-11-11):** PAT and `/about/user` are verified against the official 6.7.9 image; 247 API routes plus OAuth package routes exist. Native login/reset/MFA/profile/PAT/OAuth-client screens remain an **approved native identity handoff**. OAuth code/refresh, MFA, reset and invitation delivery remain unverified in the isolated fixture. See `RUNTIME-CONTRACT-EVIDENCE.md`.

### GAP-02 — Statement reconciliation

**Owner:** CORE-06; dependencies CORE-02/03/04.

The UI accepts statement dates/opening/closing balances, selects journals, computes mismatch, marks selected journals reconciled and optionally posts a special corrective reconciliation transaction. Generic flag editing is not this workflow.

Evidence:
- `firefly/firefly-iii/routes/web.php:229-249,1332-1333`: page, submission, overview/transaction JSON and unreconcile.
- `firefly/firefly-iii/app/Http/Controllers/Account/ReconcileController.php:81-94,128-164,172-206,214-267`: editable asset-only guard, balances, selected-journal mutation and special account/type posting.
- `firefly/firefly-iii/resources/views/accounts/reconcile/index.blade.php:33-95,119-132`: actual statement fields and active v1 script.
- `firefly/firefly-iii/public/v1/js/ff/accounts/reconcile.js:83-106`: local checked-state persistence.
- `firefly/docs/docs/docs/how-to/firefly-iii/finances/reconcile.md:19-51`: documented matching and negative/positive/zero outcomes.

**Closure:** prove an equivalent composition using only existing supported API contracts; test exact decimal and inclusive date boundaries, selected in-range journals, positive/negative/zero mismatch, special correction type/account, retries/partial failure, edit-and-return selections and unreconcile restrictions. Do not substitute an ordinary transfer. Special corrective posting has no established supported API equivalent and remains residual unsupported under the immutable backend. A native reconciliation fallback is only a proposal requiring explicit user scope choice, not full native financial parity; backend extensions are forbidden.

**Runtime classification (FND-08-b, 2026-11-11):** the 247-route API surface contains no reconciliation route. Statement matching, computed mismatch, reconcile/unreconcile and special corrective posting remain **residual unsupported**; no ordinary transfer or generic edit is accepted as equivalent. See `RUNTIME-CONTRACT-EVIDENCE.md`.

### GAP-03 — Reports and chart-data equivalence

**Owner:** ANA-03; dependencies ANA-01/02 and account/budget/classification/piggy/subscription detail tasks.

Current UI has a builder and six report families: default, audit, budget, category, tag and combined expense/revenue counterparty (`double`). Report-data families supply balances, income/expense operations, account/classification matrices, subscriptions, top/average values and multiple charts. Summary/insight/five chart operations are useful inputs, not established parity.

Evidence:
- `firefly/firefly-iii/routes/web.php:420-741,929-945,949-1215,1389-1393`.
- `firefly/firefly-iii/app/Http/Controllers/ReportController.php:81-182,334-375`: generators and builder routing.
- `firefly/docs/docs/docs/how-to/firefly-iii/finances/reports.md:11-43,49-86`: date/all-object aliases, report purposes, audit before/after balances and table interactions.

ANA-02 represents integrated analysis within existing detail/dashboard/report screens; a standalone current insights page was not established. Do not confuse every API-only aggregate with an existing screen.

**Closure:** map every visible table/series/filter/drill-through to an API result or tested calculation. Compare against server reports with multi-currency, multiple accounts, unassigned categories/budgets/tags, split transactions, liabilities and long periods. Confirm documented relative-date aliases in binders/runtime. Preserve audit running balances, scope URLs and table/chart accessibility. Do not silently drop unsupported panels or replace reports with links. Unreproducible financial series remain residual unsupported; any old-UI report handoff requires a transparent user scope choice and is not full native parity. No backend extension or scraping is allowed.

**Runtime classification (FND-08-b, 2026-11-11):** `summary/basic`, balance and insight aggregates respond with a date range; no report-data/report-family route exists. Report families, audit before/after balances and combined counterparty matrices remain **residual unsupported** rather than silently replaced. See `RUNTIME-CONTRACT-EVIDENCE.md`.

### GAP-04 — Preference and notification side effects

**Owners:** SYS-03 (preference side effects) and SYS-09 (user/owner encrypted notification settings and delivery tests); FND-06 owns shared date/shell integration, SYS-05 owner-panel composition.

Raw `/preferences` reads/writes exist, but full web-save semantics are not established: range/session refresh, primary-currency conversion event, optional transaction fields, encrypted channel credentials, per-event notification enablement and delivery tests. Owner credentials are installation-level rather than per-user.

Evidence:
- `firefly/firefly-iii/app/Http/Controllers/PreferencesController.php:110-156,243-291,294-367,377-402`.
- `firefly/firefly-iii/routes/web.php:849-855,1451-1454`.
- `firefly/firefly-iii/app/Http/Controllers/HomeController.php:65-121`: session date state.
- `firefly/firefly-iii/resources/views/layout/v3/session.blade.php:46-49`: session mirrored into localStorage.

**Closure:** compare allowed API keys and write side effects one by one without a web-session bridge. Preserve encrypted secret handling; do not save channel tokens as ordinary plaintext preferences. Test conversion recalculation, fiscal/view range, English onboarding defaults, cross-user storage isolation and email/Slack/Pushover/ntfy tests. Establish one frontend date-state source of truth. SYS-09 owns all user/owner notification settings and delivery tests; SYS-03 owns ordinary preferences and SYS-05 composes the owner panel. Missing encryption/delivery contracts remain residual unsupported; native notification forms are an unapproved scope-choice proposal, not covered by the identity exception.

**Runtime classification (FND-08-b, 2026-11-11):** ordinary `/preferences` read/write works (FND-06 stored `frontpageAccounts` and optional fields). Notification credential encryption and delivery tests have no API operation and remain **residual unsupported**; do not store channel secrets as plain preferences. See `RUNTIME-CONTRACT-EVIDENCE.md`.

### GAP-05 — Owner invitations and operational settings

**Owner:** SYS-05; dependencies SYS-04/08.

Admin users CRUD and configuration reads/writes have API support. Remaining comparisons include invitations/revocation, automatic/manual update checks, writable configuration keys and owner notification/test-message semantics.

Evidence:
- `firefly/firefly-iii/routes/web.php:1409-1454`.
- `firefly/firefly-iii/app/Http/Controllers/Admin/UserController.php:165-203,234-254`: invitation policy, roles, status and credential changes.
- `firefly/firefly-iii/app/Http/Controllers/Admin/ConfigurationController.php:70-82`: registration/demo flags, external maps/rates, running balances, webhooks, batch and expressions.
- `firefly/firefly-iii/routes/api.php:761-800`: partial configuration/user support.

**Closure:** field/permission matrix for each owner action; preserve internal/external identity and single-user registration policies, self-owner safeguards, invitation email/token states and update-check results. Release-note retrieval is not a manual update check. Reuse GAP-04 for notification credentials/tests. Do not waive missing actions by sending users to `/settings`.

**Runtime classification (FND-08-b, 2026-11-11):** owner `/users` CRUD and `/configuration` routes exist, but invitation email/token state and manual update checks have no API operation and remain **residual unsupported**. Owner-only writes were not probed because the disposable test user is not an owner. See `RUNTIME-CONTRACT-EVIDENCE.md`.

### GAP-06 — Piggy operations, rescan, audit and convenience/automation helpers

**Owners:** CORE-03/05/08/09, AUTO-01/02; dependency CORE-04.

Candidate compositions need proof, not invented dedicated endpoints:
- Piggy add/remove may compose allocation PUT, but event creation/fund constraints must match; reset-history has no established equivalent. UI routes: `firefly/firefly-iii/routes/web.php:829-845`; history chart `:693-697`.
- Subscription rescan: `firefly/firefly-iii/routes/web.php:274,292`; no dedicated rescan operation in API inventory.
- Transaction audit-log read: `firefly/firefly-iii/resources/views/transactions/show.blade.php:540-548`; no API equivalent established.
- Clone, type conversion and separate mass/bulk editors: `firefly/firefly-iii/routes/web.php:1321-1326,1341-1371`; `firefly/firefly-iii/app/Http/Controllers/Transaction/BulkController.php:119-131` applies rules. Maintenance bulk API only reassigns accounts; it is not the general UI editor.
- Rule duplicate/create-from-bill/create-from-journal and unsaved tests: `firefly/firefly-iii/routes/web.php:1224-1243`.
- Recurrence-from-journal and calendar events/suggestions: `firefly/firefly-iii/routes/web.php:914,923-925`.

**Closure:** document exact helper inputs/defaults, identities stripped on clone, split-preserving updates, rule/webhook effects, event/history behavior, scheduling/timezone math and partial-failure handling. Use generic CRUD only where equivalence is demonstrated. Otherwise retain a residual unsupported gap and present any native fallback for explicit user scope choice; do not omit the workflow or seek an extension within this boundary. See API constraints in `firefly/frontend/plans/API-REFERENCE.md`, Financial and destructive-operation contracts.

**Runtime classification (FND-08-b, 2026-11-11):** no rescan, audit-log, clone, mass/bulk-editor, unsaved-rule-test or recurrence-helper route exists. Split-preserving PUT was proven with two retained journal IDs; generic CRUD and recurrence trigger routes exist. Dedicated helpers remain **residual unsupported**. See `RUNTIME-CONTRACT-EVIDENCE.md`.

### GAP-07 — Installer, recovery, system/help and diagnostics

**Owner:** SYS-08; dependency FND-06.

Installer is available before ordinary application state, runs a fixed command list only for missing/old database state, reports progress/errors and generates keys. Debug/API-test, flush/routes/error screens, help/tours and some operational state are web/session surfaces. Health and about/release-note API reads cover only part.

Evidence:
- `firefly/firefly-iii/routes/web.php:90-112,141-170,809-812`.
- `firefly/firefly-iii/app/Http/Controllers/System/InstallController.php:62-135,141-195`: allowlist, state guard, throttled command execution and keys.
- `firefly/firefly-iii/resources/views/layout/v3/session.blade.php:139-144,336-371`: contextual help and active legacy scripts.
- `firefly/docs/docs/docs/how-to/firefly-iii/advanced/cron.md:3-20,68-99`: cron deployment/token requirements.

**Closure:** define accessible pre-install/upgrade/progress/error/recovery equivalents, sanitized diagnostics, cache/storage reset semantics and contextual guidance. Operational probes are not ordinary navigation screens. Cron is a side-effecting GET with separate CLI/static token auth; never probe it during discovery. Static-token versus user-token execution scope must follow backend implementation, not the docs' broad all-users wording (`firefly/frontend/plans/API-REFERENCE.md`, Adjacent surfaces outside this CSV). Use only official-image deployment/operator procedures; no frontend DB access, arbitrary command runner or backend patching. Native installer/recovery/help handoffs outside identity remain explicit proposals needing user scope choice, not verified closure.

**Runtime classification (FND-08-b, 2026-11-11):** `/release-notes` responds; no installer/recovery/update-check API exists. Installer, recovery, native diagnostics and help remain **operational/approved native guidance**, and cron was not probed. See `RUNTIME-CONTRACT-EVIDENCE.md`.

## Current UI versus historical, incomplete or external material

| Finding | Planning consequence and evidence |
| --- | --- |
| Current layout is Blade/Alpine v3, with active v1 assets | Home calls `indexV1` despite current v3 views. Do not discard v1-named workflows. `firefly/firefly-iii/app/Http/Controllers/HomeController.php:129-142`; `firefly/firefly-iii/resources/views/layout/v3/session.blade.php:336-371`; `firefly/firefly-iii/resources/views/accounts/reconcile/index.blade.php:119-132`. |
| Bills/subscriptions are aliases | One domain, preserve active compatibility aliases. `firefly/firefly-iii/routes/web.php:269-303`. |
| Administration lifecycle is unfinished | Current list/edit changes title and primary currency. Creation/switch/membership/deletion routes are disabled, not missing implemented UI to reproduce. `firefly/docs/docs/docs/explanation/financial-concepts/administrations.md:3-13`; `firefly/firefly-iii/routes/api.php:359-374`; actual edit payload `firefly/firefly-iii/resources/assets/v3/js/pages/administrations/edit.js:75-97`. Template migration remnants `firefly/firefly-iii/resources/views/administrations/edit.blade.php:50-56` require runtime verification. |
| Multiple users do not imply shared finances | Separate administrations are supported; shared administration explicitly is not. `firefly/docs/docs/docs/how-to/firefly-iii/features/multi-user.md:3-15`. |
| Import is a separate application | No embedded importer screen established. Connection/PAT/OAuth and internal/public URLs are documented external setup, not a native replacement completion claim. `firefly/docs/docs/docs/explanation/data-importer/separate-tool.md:3-11`; `firefly/docs/docs/docs/how-to/data-importer/how-to-configure.md:18-61`. External-tool integration remains separately scoped and unverified; it is not native financial parity. |
| Provider tutorial presence is not support | Several providers are explicitly not supported; Salt Edge instructions were withdrawn. `firefly/docs/docs/docs/how-to/data-importer/how-to-configure.md:63-116`. Do not promise every navigation item as working functionality. |
| UI export is one all-transactions CSV action | Advanced exports already have API/CLI support; no current complete export/restore wizard. CSV is not a backup. `firefly/firefly-iii/resources/views/export/index.blade.php:13-24`; `firefly/firefly-iii/app/Http/Controllers/Export/IndexController.php:68-113`; `firefly/docs/docs/docs/tutorials/firefly-iii/exporting-data.md:3-21,50`. |
| Exchange-rate writes are current API-backed UI | Commented web mutation routes do not mean missing UI. `firefly/firefly-iii/resources/assets/v3/js/pages/exchange-rates/rates.js:26-30,71-95,166-180`. |
| API-only features are not automatically current UI | Keep API inventory separate. Insights are integrated; webhook message/attempt API deletion does not prove a current UI delete affordance. Inventory only source-confirmed tasks and explicitly marked operational guidance. |
| Docs contain obsolete build instructions | Installation FAQ says v1/v2; development FAQ still says two workspaces. Current backend has only v3. `firefly/docs/docs/docs/references/faq/install.md:29-38`; `firefly/docs/docs/docs/references/faq/development.md:27-31`; `firefly/firefly-iii/package.json:5-7`. |

## Documentation topic tree and source priorities

Authoritative local navigation: `firefly/docs/docs/sourcey.config.ts`; Markdown root: `firefly/docs/docs/docs`.

- Tutorials: initial accounts/transactions, subscription/refund/mortgage, import/export and Data Importer CSV/CAMT/providers (`:76-179`).
- How-to: deployment/upgrades; notifications/authentication/backup/locales/cron; finances including reconcile/reports; multi-user/rules/expressions/webhooks/search/currencies/CLI/API (`:201-358`).
- Data Importer how-to: separate installation/configuration, file/automated/JSON/mapping/transfer/duplicate/provider flows and CLI/POST (`:363-471`).
- References: account/transaction types, search grammar, rule triggers/actions/expressions, API/CLI, third parties, changelogs and FAQs (`:476-602`).
- Explanation: classification, financial concepts/administrations, time periods, zero-based budgeting, architecture/security and importer separation (`:605-754`).

Use current routes plus controller/view/script behavior as exposure evidence. Use docs for financial meaning and operating prerequisites, clearly marking TODOs, old screenshots/menus, unverified aliases and external products. Tutorials alone do not establish current affordances. Follow current canonical task ownership for all implementation/planning edits; historical research responsibility is not a permanent write restriction.

## Runtime, docs and test prerequisites

### Documentation site

From `firefly/docs/docs`: `npm install`, `npm run dev`, `npm run build` (output `site`). Package uses Sourcey `^3.9.2`, ESM and no declared test script. Navigation reads Markdown root `docs`, uses custom CSS/self-hosted fonts. Evidence: `firefly/docs/docs/package.json:1-10`; `firefly/docs/commands.txt:1-8`; `firefly/docs/docs/sourcey.config.ts:20-28,63-66`.

No exact docs Node engine is declared in this package manifest. Do not label release CI's Node version as a docs requirement. Newest OpenAPI fetch is commented out, so enabled export flags are not proof of an active complete bundled API reference (`firefly/docs/docs/sourcey.config.ts:3-8,57`).

### Backend and existing UI (historical source evidence, not build instructions)

- Current checkout declares PHP **>=8.5**, Laravel **^13**, required extensions and PHPUnit **^13** (`firefly/firefly-iii/composer.json:67-109,111-129`). Configured application version is 6.7.9; unused config API version is not the HTTP URI generation (`firefly/firefly-iii/config/firefly.php:81-84`).
- Deploy the official original 6.7.9 Docker image pinned by immutable digest, not this source checkout. Use supported image environment/volumes for app/Passport keys, runtime storage and database initialization; only the backend accesses its database. Historical self-managed prerequisites are source evidence (`firefly/docs/docs/docs/how-to/firefly-iii/installation/self-managed.md:9-46,100-157`), not permission to build a custom image.
- Historical backend UI build used `npm run build --workspace=v3` and release CI Node **24** (`firefly/firefly-iii/.github/workflows/release.yml:45-47,184-189`). This is not the new frontend build: Next.js / React / TypeScript ships separately on its own domain in the same Compose deployment. Do not rebuild backend UI/assets.
- Historical Composer hooks can clear caches and upgrade the database (`firefly/firefly-iii/composer.json:173-185`). Do not run them or modify backend dependencies; use supported official-image lifecycle procedures in isolated acceptance environments, never against user data during discovery.
- Cron is required for auto-budgets, recurring generation, subscription warnings and exchange rates (`firefly/docs/docs/docs/how-to/firefly-iii/advanced/cron.md:3-11`). Notification channels need their own service credentials; importer needs separate deployment and URL/auth configuration. External service privacy, cost and rate limits need task-specific review.

### Tests and local availability

- `composer unit-test` and `composer integration-test` select the declared suites; PHPUnit also declares `feature`. SQLite testing configuration has blank `DB_DATABASE`; confirm test database resolution before running (`firefly/firefly-iii/composer.json:187-195`; `firefly/firefly-iii/phpunit.xml:36-56`).
- Integration base refreshes/seeds the database and creates user/group/owner membership (`firefly/firefly-iii/tests/integration/TestCase.php:37-68`). Existing tests emphasize calendar/navigation/search and selected API integrations, not full UI workflow parity. Backend package manifests declare no browser-test command.
- Initial read-only environment check: PHP command missing, Composer not found, Node v26.13.0, npm 12.2.2; backend `vendor` and root `node_modules` absent. No application tests/builds were run. Artifact validation is separate from application validation.
- Future acceptance fixtures should cover ordinary/owner/demo/external-auth users; empty administration; splits; reconciliation and opening balances; assets/liabilities/cash; multi-currency precision; classification absence; disabled features; cron-dependent state; notification failures and destructive confirmations. Browser tests must cover the complete user task, not just endpoint availability.

## English-only release and accessibility

### Historical localization versus current data formatting

- The current frontend release is **English only**: no multilingual language selector, translation generation, translated-message acceptance suite or RTL delivery requirement. Keep historical language/locale workflows and stable IDs as source evidence, not current multilingual obligations.
- Historical backend behavior separates language from formatting locale (`equal` follows language), uses Blade/i18next translation assets and Crowdin release generation, and enables Arabic in configuration. Evidence: `firefly/firefly-iii/app/Http/Controllers/PreferencesController.php:322-339`; `firefly/firefly-iii/resources/assets/v3/js/support/load-translations.js:28-58`; `firefly/firefly-iii/.github/workflows/release.yml:163-179`; `firefly/firefly-iii/config/firefly.php:137-142`. These are not frontend build prerequisites or a claim of tested RTL.
- Preserve financial decimal strings, currency precision/placement, date/timezone and fiscal-period semantics in English. Browser date-input presentation may still follow browser locale (`firefly/docs/docs/docs/how-to/firefly-iii/advanced/locales.md:3-12,28-34,56-68`); do not confuse English-only copy with two-decimal or US-only financial assumptions.

### Accessibility

Existing hooks: translated document `lang`, zoom-enabled viewport, light/dark/browser preference, navigation label, profile tab relationships and alert roles (`firefly/firefly-iii/resources/views/layout/v3/session.blade.php:1-2,54-69,151-203`; `firefly/firefly-iii/resources/views/components/layout/sidebar.blade.php:1-7`; `firefly/firefly-iii/resources/views/profile/index.blade.php:7-28`; `firefly/firefly-iii/resources/views/components/layout/flash.blade.php:3-28`).

These are not a compliance certification. `data-lte-contrast="aa"` does not establish WCAG AA. Sidebar/privacy/help controls have missing explicit accessible names in inspected markup (`firefly/firefly-iii/resources/views/layout/v3/session.blade.php:99-102,128-144`). Reconciliation inputs rely on surrounding table text instead of associated labels (`firefly/firefly-iii/resources/views/accounts/reconcile/index.blade.php:33-58`). Layout mentions dynamically added skip links but implementation was not established (`firefly/firefly-iii/resources/views/layout/v3/session.blade.php:60-61`).

Required acceptance criteria: keyboard-only navigation/split editing/reconciliation; accessible names for every icon control; dialog focus trapping/restoration; field-associated errors and live loading/result announcements; chart-equivalent tables; non-color-only financial/status cues; tested contrast/zoom; reduced-motion behavior; English accessible labels and errors. Treat improvements as explicit acceptance requirements rather than claiming the old UI already meets them.

## Decision gate and completion evidence

1. Agents preserve all 119 workflow IDs and 247 API declarations; owner transfers follow canonical claims and are recorded. SYS-09 owns notifications. Coordinate shared planning-file changes through the live task protocol, not historical session names.
2. For each gap, distinguish supported API composition, approved native identity handoff and residual unsupported behavior. No backend/source modifications, extensions, plugins, custom backend images, direct DB access, bypasses, scraping or broad HTTP-session bridge are permitted.
3. Record method/schema/permission/error/side-effect contracts and financial fixtures against the official immutable 6.7.9 image. Keep impossible financial behavior visible (including special reconciliation posting, audit-log reads and history-reset contracts without API equivalents); offer unsupported/old-UI handoff options for explicit user scope choice rather than silently waiving parity. The declared `api.v1.currencies.cer` missing-method discrepancy remains visible and unsupported; do not patch or hide it.
4. Native financial closure requires tested supported contracts and source-vs-result acceptance parity. Approved native identity closure instead requires tested user-context-safe linkage and frontend session/token isolation, with no credential-bearing handoff URL. An external tool or old financial screen is not full native parity and has no blanket approval.
5. Initial inspection snapshot: all 119 UI rows and 247 API rows are `planned`, API verification `static_not_runtime_verified`. Future agents update evidence states with implementation/contract/handoff tests and reasons per README/FND-09; validators must not freeze initial statuses. Disposition alone never proves implementation or verification, and unsupported residuals never become passing native capabilities.
