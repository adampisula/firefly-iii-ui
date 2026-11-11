# Plan 04 — Settings, security and operations

Canonical state table below. **BASE = FND-04/05/06/07/08/10 done.** Common scope: corresponding `frontend/src/features/<domain>/`, route files, local tests and owned inventory evidence. Authentication integration is foundation-owned. Use the accepted Next.js/React/TypeScript frontend, Firefly branding / Verdelo style and English-only UI with currency-aware money/date formatting. `frontend/` is its own git repository. Backend session/web actions are not available through API mediation: native login, registration, reset, MFA, profile/security, OAuth client/PAT and cron-token management stay in the trusted backend UI through explicit handoffs; do not rebuild identity.

All tasks require source/API request-field audit, permissions/feature flags, responsive/accessibility/error-state coverage and disposable-backend verification. Existing owner role and partial administration roles are distinct. Target exactly Firefly III 6.7.9 using only the official original image: no backend/source changes, extensions, patches, plugins, custom backend image, scraping, backend-session proxy bypass or direct DB access. PAT and native OAuth are acceptable frontend authentication integrations, not permission to recreate identity management.

**Completion/capability rule:** FND-08 must resolve/report unavailable contracts and seek user choice when non-identity workflows are truly impossible; do not silently waive missing financial functions. Declare supported-slice and residual-gap children, keeping unavailable actions visible as unsupported/read-only or explicit trusted backend UI handoffs. Supported slices can complete with runtime evidence without waiting for forbidden backend extensions; residual inventory rows stay owned and unsupported/unverified, never promoted by parent completion. Approved identity handoffs are complete boundary behavior, not identity deficiencies or native frontend parity. Release must report scoped capabilities and all residual gaps honestly.

## Status board

| ID | Task | Status | Depends on / gate | Owner/session | Updated UTC |
| --- | --- | --- | --- | --- | --- |
| SYS-01 | Currency and exchange-rate management | done | BASE; CORE-02 | Kilo (deepseek agent) | 2026-11-11 21:11:00 UTC |
| SYS-02 | Existing financial administration settings | done | BASE; SYS-01 | Kilo (deepseek agent) | 2026-11-11 21:13:00 UTC |
| SYS-03 | Preferences, locale, appearance and date defaults | done | BASE; FND-08 GAP-04 preference disposition | Kilo (deepseek agent) | 2026-11-11 21:08:00 UTC |
| SYS-04 | Profile, MFA, recovery and token/client lifecycle | done | BASE; FND-05 trusted native identity handoff | Kilo (deepseek agent) | 2026-11-11 21:02:00 UTC |
| SYS-05 | Owner users/config/invitations/update checks | done | BASE; FND-08 GAP-05 supported/residual split | Kilo (deepseek agent) | 2026-11-11 21:15:00 UTC |
| SYS-06 | CSV exports and Data Importer integration | done | BASE; DEC-06 importer boundary | Kilo (deepseek agent) | 2026-11-11 21:06:00 UTC |
| SYS-07 | Destructive data maintenance and deferred processing | done | BASE; CORE-04/05 | Kilo (deepseek agent) | 2026-11-11 21:15:00 UTC |
| SYS-08 | About/config capabilities, help, cron and installer/support | done | BASE; FND-08 GAP-07 disposition | Kilo (deepseek agent) | 2026-11-11 21:04:00 UTC |
| SYS-09 | User and owner notification configuration/testing | done | BASE; FND-08 GAP-04 notification disposition | Kilo (deepseek agent) | 2026-11-11 21:09:00 UTC |

**Handoff — SYS-01…SYS-09, 2026-11-11**

Owner/session: Kilo (deepseek agent) | updated UTC: 2026-11-11 21:15:00 UTC  
Status: all plan-04 tasks done with supported slices and explicit residuals. No backend change, DB access or identity rebuild.  
Changed files (umbrella): `src/lib/api/operations.ts` (currencies/rates, preferences, exports, users/config, user-groups, data maintenance), `src/features/currencies/*`, `src/features/preferences/*`, `src/features/administrations/*`, `src/features/administration-users/*`, `src/features/maintenance/*`, `src/app/(app)/currencies/*`, `exchange-rates`, `preferences`, `administration`, `admin/users`, `security`, `notifications`, `maintenance`, `export`, `help`, `reports`, `src/app/api/export/[resource]`, `src/app/api/attachments/[id]/download`, `src/lib/nav.ts`, new tests `core-sys01-currencies`, `core-sys02-administration`, `core-sys03-preferences`, `core-sys05-users`, `core-sys07-maintenance`, plus browser specs and inventory updates.  
Acceptance completed: SYS-01 currency/rate reads, related endpoints, CER 500 evidence, owner-gated writes; SYS-02 administration title/primary currency read and role-gated write; SYS-03 five preference operations and key-by-key page; SYS-04 trusted native identity handoffs; SYS-05 permission-gated owner users/config UI; SYS-06 all ten CSV exports plus importer/backup boundaries; SYS-07 confirmed destroy/purge with bulk residual; SYS-08 release/config/cron/help diagnostics; SYS-09 notification residual without secret storage.  
Acceptance remaining: owner-only currency/rate/user/link-type writes lack an owner fixture; bulk exchange-rate endpoints returned 500 and are not claimed; invitations/manual update checks/notification delivery have no API; SYS-07 bulk transaction edit/batch finish unexposed; locale-refresh side effects remain residual. No unsupported row was promoted.  
Checks: lint/format/typecheck clean; unit suite **94 passed**; live official-6.7.9 integration suite **37 passed**; browser suite **49 passed** (axe across new routes); build and production smoke; `npm audit` 0 vulnerabilities; `validate:plans` 247 API/119 UI intact.  
Inventory: read/permission/CER/export/destroy/purge evidence recorded; owner-only and no-API rows remain implemented/static, unsupported or residual.  
Blockers/decisions: no owner fixture and no enabled webhook/notification APIs; destructive bulk workflows remain residual.  
Next action: QA/delivery plan (`05-qa-delivery.md`) is the remaining programme phase; domain implementation plans 02–04 are complete except explicit residuals.  
Newly ready tasks: QA plan tasks as defined by its canonical table (not claimed here).

## SYS-01 — Currencies and exchange rates

**Scope:** `features/currencies/`, `features/exchange-rates/`; may split child owners by folder.

**Work**
- Currency list/detail/create/update/delete, enabled state and primary/default behavior; role-aware fields (non-owner updates may silently discard metadata). Related accounts/available budgets/bills/limits/recurrences/rules/transactions and CER relationship handled without invented schema.
- Exchange-rate pair list, per-ID/per-pair/per-date reads/update/delete, create/upsert, pair deletion, bulk by date and by currencies; dated and inverse-rate presentation consistent with backend. Explain rate/native/primary implications and enabled/download feature state.
- Record the immutable `currencies.cer → ListController@cer` missing-method defect: capture runtime evidence against exactly 6.7.9 and classify the operation as unsupported/unverified; no backend fix is allowed. Do not redirect it to a guessed endpoint and claim verified.

**Acceptance:** all 30 operations accounted for with runtime tests for the supported subset and explicit defect evidence for the unsupported row; zero/2/3-decimal currencies, owner/non-owner/admin-role differences, in-use disable 409, primary changes, exact date/pair/upsert/reciprocal behavior and bulk partial validation. Financial data isn't relabeled into another currency on a display-only selection. The 30-operation inventory retains the defective `currencies.cer` row as unsupported/unverified; supported currency/exchange-rate management can complete separately. FND-08 reports the immutable defect and seeks user choice; neither a workaround link nor parent completion verifies the row. No route omission to achieve 100%.

## SYS-02 — Administration title and primary currency

**Scope:** `features/administrations/`.

**Work**
- List/show/edit existing administration title and primary currency through three active endpoints; reflect administration role and conversion effects. Reuse SYS-01 currency control and refetch account/summary/cache state appropriately.
- Clearly model administration ID separately from user ID. Confirm endpoint-by-endpoint accepted `user_group_id` rather than apply globally. No create/delete/switch/membership/sharing screens for commented-out future routes.

**Acceptance:** three operations verified for eligible/ineligible roles and cross-user IDs; primary currency change persists and related figures refresh without cross-administration leakage. UI makes only supported capabilities available; no household-sharing promise based on design demo.

## SYS-03 — Preferences and appearance

**Scope:** `features/preferences/` and integration adapter for shell preference provider; FND-06 owns shell layout/date provider. Coordinate shared changes.

**Work**
- List/read/create/update supported named preferences and batched read; key-by-key field/side-effect mapping, not arbitrary JSON editor. English-only interface, distinct format locale (`equal` where supported), page size, date-view range, dashboard accounts, fiscal year, conversion preference and optional transaction fields. Preserve backend language settings without adding translation/RTL UI or forcing an unsupported preference write.
- Theme/system/frost/rail/privacy integrate local appearance contract; avoid conflating browser-only settings with backend preferences. Validate persistence rules and account-specific storage namespace/cleanup. Currency primary endpoint replaces legacy currency preference writes.
- GAP-04: implement equivalent session date refresh, conversion recalculation/event, reload/locale effects and onboarding defaults using verified existing APIs/compositions only; unavailable session-side effects remain visible residuals for FND-08/user choice, not a reason to block supported preferences. Notification credentials belong to SYS-09, not ordinary plaintext preference writes.

**Acceptance:** five preference operations; reload/cross-tab/frontend-auth-change behavior, English UI with currency-aware locale/date/decimal formats and fiscal defaults verified for the supported slice; unavailable effects remain unsupported/unverified; transaction fields obey toggles without data loss. Conversion on/off changes the right backend/display state; no hidden writes to unsupported keys. Invalid/read-only keys and stale saved values handled. Shared date source remains singular; secrets not persisted here.

## SYS-04 — Trusted native identity/profile/MFA/OAuth handoffs (GAP-01 boundary)

**Scope:** frontend `features/profile/`, `features/security/`, `features/api-access/` handoff/navigation/help surfaces only; coordinate PAT/native OAuth integration and frontend auth state with FND-05. No backend files, replacement identity forms or backend-session adapter.

**Work**
- Explicit, clearly labeled trusted backend UI handoffs for login, registration/invite acceptance, password reset, email confirmation/undo, password/profile security, other-session management and account deletion. The backend/IdP owns all identity validation, restrictions and forms; no admin `/users` substitution for self-service.
- MFA enrollment/challenge/disable/recovery and backup codes remain entirely backend-owned. Never proxy session/CSRF challenges, fetch QR/secret/code data into frontend state, or duplicate native recovery flows.
- PAT create/list/revoke, OAuth client lifecycle/secret regeneration/consent and CLI/cron-token display/regeneration remain backend UI workflows. Frontend may use a PAT or native OAuth through FND-05; do not expose backend secrets in links, browser bundles, logs or analytics.
- Handoffs use an explicitly configured/validated public backend HTTPS URL, distinct from internal upstream and public frontend URLs. Backend cookies stay backend-host-only, frontend auth cookies frontend-host-only; no cross-domain cookies or backend-session forwarding. OAuth uses registered frontend callback and validated state/PKCE as supported; return navigation is allowlisted, not an arbitrary redirect. Explain native-backend context and frontend token revocation/re-authentication effects.

**Acceptance:** tested handoff matrix covers internal/external identity and applicable demo/blocked/unactivated/MFA/reset/consent paths on the trusted native UI without claiming those forms were rebuilt. Links cannot send credentials to arbitrary hosts; frontend never consumes backend session cookies or identity secrets. Verify native OAuth consent/cancel/state/callback and PAT expiry/revocation behavior, accessible context/return guidance, frontend logout/cache isolation and honest distinction from backend logout. Approved identity handoffs satisfy this task and are not release deficiencies. Mark handoff evidence as such, not native frontend API parity; do not falsely verify unavailable API rows.

**Suggested children:** `SYS-04-a` profile/security handoffs; `-b` MFA/recovery handoffs; `-c` PAT/OAuth-client/cron-token handoffs; `-d` login/registration/reset/consent navigation and return tests. Add board rows and exact frontend-only write scopes first; FND-05 remains owner of frontend authentication integration.

## SYS-05 — Owner administration (GAP-05)

**Scope:** `features/admin/users`, `features/admin/configuration`, `features/admin/invitations`, `features/admin/updates`; may split children with disjoint folders. Notification panels consume SYS-09.

**Work**
- User CRUD list/detail/edit/delete, role/status/blocking and supported email/password fields; inspect exact API field parity. Preserve self-owner/last-owner protections from backend (do not invent unsupported guarantees). Demo, internal/external auth and registration policies correctly reflected.
- Allowlisted configuration read/update using SYS-08 capability adapter; actual owner settings include applicable registration/demo/maps/rates/running-balance/webhook/batch/expression flags. No write UI for static/read-only config.
- Invitation create/revoke/accept states and email handling only through existing supported GAP-05 APIs/compositions, not assumed `/users` create equivalence; native invite acceptance is an identity handoff. Unsupported invitation-management actions remain visible residuals for FND-08/user choice.
- Update-check configuration/manual execution/results distinct from release-notes fetch; installation notifications delegated to SYS-09. Dangerous changes require review/confirmation and clear operational effects.

**Acceptance:** six assigned API operations plus user CRUD field parity; owner/non-owner/cross-user and disabled/demo tests. Every visible config flag is backed by allowed writable key and refreshes capability/UI state. Invitations cannot bypass registration policy; failed email/token expiry/revocation handled. Manual update check reports a real outcome only where an existing API supports it; unavailable configuration/invitation/update-check actions remain unsupported/unverified residuals while the supported admin slice can complete. Non-owners cannot invoke handlers even via direct URL.

## SYS-06 — Export and separate importer integration

**Scope:** `features/data-portability/`.

**Work**
- Export transactions as in existing UI plus every API export type: accounts, bills/subscriptions aliases, budgets, categories, piggy banks, recurring templates, rules, tags, transactions. Applicable date/account/administration filters follow actual controller support; no assumed common export schema.
- Stream/download CSV with correct filename/encoding/errors and safe handling of user-controlled content; inspect spreadsheet formula-injection behavior, document format changes or compatibility constraints instead of silently changing accounting exports. Show export may contain sensitive data.
- Data Importer remains separate by default proposal; after DEC-06 provide secure open/configure/help flow for configured internal/public URLs and documented OAuth/PAT setup. No credential-bearing URL or implementing new bank/CSV engine unless separately requested.
- Clearly distinguish CSV export from database backup/restore. Preserve existing import access workflow; full external-importer UI replacement is not assumed part of core Firefly scope without explicit decision.

**Acceptance:** ten export operations incl aliases, actual content and date/filter scope verified for empty/large/Unicode/multi-currency data; demo/role restrictions respected, download interruption and error bodies handled. No unbounded browser-memory conversion of huge files. External importer config is validated/trusted and token remains private. User-approved importer boundary recorded; CSV never labeled restorable backup.

## SYS-07 — Maintenance, purge and batch completion

**Scope:** `features/maintenance/` and specialized deferred-processing controls; normal mass/bulk editor stays CORE-05.

**Work**
- Dedicated dangerous-data screen: per-object-family destruction, optional unused-account cleanup, permanent purge with count/scope/irreversibility review and explicit confirmation. Distinguish ordinary resource delete and soft-delete purge.
- Narrow `/data/bulk/transactions` account reassignment with validated JSON-string query semantics; coordinate CORE-05 so UI bulk/mass editing is not wrongly represented by this operation.
- `/batch/finish` deferred transaction processing and literal-string `apply_rules` contract; if batch mode requires special writes, show resumable outstanding-processing state using verified backend support, no imagined job-status API.
- No automatic retries/optimistic deletion. Handle interrupted/partial execution with authoritative requery and precise not-yet-known state; no Undo promise for permanent deletion.

**Acceptance:** four operations on disposable datasets only; each family selection/scope, unauthorized access, unused accounts, purge permanence, reassignment restrictions and rule effects checked. Confirmation names affected scope and warns irreversibility; accidental Enter/navigation cannot trigger. Tests cannot target production by environment default. Batch finish does not run on mere screen visit.

## SYS-08 — System/config/about, cron and support (GAP-07)

**Scope:** `features/system/`, `features/help/`, pre-install/error/support routes and capability adapter (shared auth bootstrap imports need coordination). API-only operations get purposeful controls/docs rather than arbitrary request console.

**Work**
- About/current-user/release notes and read-only allowlisted configuration: useful human display, capability enum adapters for rules/search/webhooks/accounts, safe Markdown, exact-version/compatibility diagnostics. Detect the running version through trusted backend metadata and require exactly 6.7.9; unknown/unavailable/mismatched version fails closed for financial access and upstream business/operational mutations, with actionable unavailable diagnostics. Protected frontend connect/callback/disconnect and compatibility recovery remain available; no financial access is granted until verification succeeds. Recheck on runtime/auth context changes and backend restarts; no stale compatibility proof authorizes writes. Never show debug traces or secrets by default.
- Contextual help/tour equivalents and source-linked local guidance; installer/upgrade/pre-auth errors/recovery/cache-reset/API-test/debug workflows only through existing supported GAP-07 APIs or explicitly labeled trusted backend UI handoffs, respecting backend state/owner guards. Unavailable operations remain unsupported/read-only residuals, never new command bridges. Never expose arbitrary Artisan/terminal execution.
- Cron status/setup guidance and explicit handoff to SYS-04's native backend cron-token management; do not display/regenerate tokens in the frontend. Assess manual execution only if already supported, explicitly requested and achievable without exporting native token-management secrets or bypassing backend identity; otherwise show an unsupported operational residual for FND-08/user choice. Cron is side-effecting GET with separate CLI/static token; never prefetch, auto-probe, cache or log its URL. Prefer per-user token; static all-user token must not be exposed to ordinary UI/users.
- Sanitized diagnostics/copy and support instructions, external links with privacy context; distinguish active maintenance from read-only health endpoints. Any native installer/upgrade observation uses a separate disposable official-image instance managed by normal backend tooling, never frontend direct DB access or normal user fixtures.
- Deployment diagnostics distinguish internal upstream URL, public backend OAuth/UI URL and public frontend URL in the same Docker Compose stack with separate public domains. Require a verified official-original 6.7.9 image tag plus digest pin; record registry evidence before configuring literal values, never invent a tag/digest or use a custom backend image. Runtime detection must agree with the pinned image, not trust an environment version string.

**Acceptance:** six API operations, safe release/config/current-user display, trusted exact-6.7.9 runtime detection matched to verified tag/digest pin, no action during render/navigation/probe. Unknown/mismatch/restart/stale-version tests prove upstream business/operational mutations and financial access fail closed while protected frontend connect/callback/disconnect and compatibility recovery still work; any supported cron execution test uses isolated per-user setup/local sinks and verifies scope; otherwise retain execution as an unsupported/unverified residual. UI never obtains installation-wide secrets or native token-management data. Supported installer/error/help behavior and denied command/state cases verified; unavailable operations stay GAP-07 unsupported/unverified residuals, not blockers for the defined supported SYS-08 slice. Health failure works before normal auth/backend is available; contextual help accessible on mobile/keyboard.

## SYS-09 — Notifications without plaintext-secret shortcuts (GAP-04)

**Scope:** `features/notifications/`, user/owner panels with agreed endpoint adapters. May read preference/config fields but SYS-03/05 remain canonical owners of generic preference/config screens.

**Work**
- Catalogue per-event enablement, user channels and owner installation-level channels; supported email/Slack/Pushover/ntfy fields, encrypted stored credentials and masked/unchanged-secret semantics. Compare web-controller validation/encryption/side effects to raw preferences API.
- Implement save/clear/test-delivery only through existing supported APIs with proven encryption/side-effect parity, accessible progress/error/result state and role-specific screens. If impossible, show unsupported/read-only state or an explicit trusted backend UI handoff and report through FND-08 for user choice; never introduce an endpoint or use plaintext preference writes. Test delivery is deliberate network action, never autosave/on-load effect.
- Do not invent a notification inbox or unread count API because design has a bell. Expose actual notification settings/results and event data only if source contract supports them.

**Acceptance:** encrypted credentials never echoed, logged or written as plaintext generic preferences; masked unchanged values don't overwrite secrets. Each supported channel/event, invalid credentials, transport failure and owner/non-owner isolation tested against local sinks only. Test delivery reports real result and cannot target another user's config. Full GAP-04 closes jointly with SYS-03 side-effect evidence, not merely storing toggles. A defined supported notification slice or honest read-only/handoff surface may complete separately, but unsupported save/test/channel rows stay unverified and retain residual ownership.
