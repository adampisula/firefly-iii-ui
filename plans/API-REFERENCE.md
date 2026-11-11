# API reference and implementation-planning handoff

## Scope, provenance, and verification boundary

This is a **planning artifact**, not an implementation or runtime conformance report. At the 2026-11-11 planning snapshot every operation in `firefly/frontend/plans/inventory/api-operations.csv` has `status=planned` and `verification=static_not_runtime_verified`. Future implementing agents update evidence states per plans/README; these are initial values, not permanently frozen requirements. Existing backend controller code is evidence for planning; it does not mean any planned client/UI work has been implemented.

Source inspected on 2026-11-11:

| Source | Pinned commit / version |
| --- | --- |
| Backend, `firefly/firefly-iii` | `d65e916130c91d8f13ca808ca088d225ddd9a939`; configured application version **6.7.9** |
| Documentation, `firefly/docs` | `db3c7b6214e4381b5dc18f26e2b952588e5c3279` |
| API route source | `firefly/firefly-iii/routes/api.php`, 878 lines at inspection |

Backend and documentation working trees were clean when their revisions were captured. Line references below describe the inspected source, not a future checkout. Read `firefly/firefly-iii/agents.md`; no application code was changed for this investigation.

**No OpenAPI document was downloaded. No HTTP endpoints, destructive actions, builds, or application tests were run.** `firefly/firefly-iii/vendor/autoload.php` was absent, so Laravel's effective route registry could not be inspected. Findings are static and require runtime verification before being promised as client contracts.

## Immutable release and integration boundary

Plans live in the frontend Git repository at `firefly/frontend/plans`. The release is an **English-only Next.js / React / TypeScript frontend** on a separate domain from the backend, deployed together in the same Compose stack. Backend target is exact **Firefly III 6.7.9**, using the **official original Docker image pinned by immutable digest**. Record the actual resolved digest before deployment; no digest is asserted here.

No source/backend modifications, extensions, plugins, custom backend images, direct database access, authorization bypasses or scraping are allowed. Source code is read-only contract evidence, not a deployment/build target. Use existing supported APIs; no broad backend HTTP-session bridge, cookie relay or web-form automation to reach private web actions. Backend-native identity/security screens are the approved trusted exception for user navigation, not a general API substitute.

Live canonical task claims in numbered plans govern file ownership, including shared planning documents. Preserve stable API/UI IDs; ownership transfers and evidence-state changes must be recorded, not silently overwritten.

## Inventory contract

The CSV contains **247 explicit method/path declarations** from active code in `routes/api.php`: **163 GET, 33 POST, 24 PUT, 27 DELETE**. Each alias remains a separate record. Commented-out routes, implicit HEAD/OPTIONS, Laravel health routes, and Passport/package/web routes are excluded from this count.

`bootstrap/app.php:68–74` loads the API route file; the inventory resolves its Laravel `/api` prefix and every local `v1/...` group prefix. All inventoried paths begin `/api/v1/`. No active v2 application API registration was found in the inspected route file.

CSV fields:

- `operation_id`: the full declared Laravel route name, such as `api.v1.accounts.index`. Stable against source-line movement; not a sequential generated number and not an asserted OpenAPI operationId.
- `method`, `path`: explicit HTTP method and resolved path. Placeholder names and optional markers are retained from source.
- `family`, `task_id`: domain and planned owner. All search/autocomplete operations belong to CORE-01, even when suggestions represent another domain.
- `source`, `source_line`: project-relative route declaration and its first line, including multiline declarations.
- `controller`, `action`: resolved fully qualified controller class and declared method.
- `controller_source`, `controller_line`: target PHP file and method declaration line when found. A blank method line is an explicit discrepancy, not omitted coverage.
- `permission_notes`: baseline middleware, route-level admin requirement, and direct controller administration-role checks when found. **Not an exhaustive RBAC proof**: request authorization, model binding, repository behavior, traits, and deployment controls can impose more restrictions.
- `alias_of`: canonical route-name reference for the 13 recognized active aliases. Aliases have the same task as their canonical operation.
- `notes`: source-grounded contract warnings and route constraints where declared, including immutable-image restrictions and residual unsupported discrepancies.
- `status`, `verification`: initially `planned` / `static_not_runtime_verified`. Evidence progresses through `implemented`, `verified`, `blocked`, `unsupported` or approved handoff states with test/disposition records as defined by FND-09. Do not treat initial snapshot markers as immutable; unsupported operations never become successfully verified client capabilities.

The source-specific generator used group-aware matching after masking line comments, resolved both string controller actions and imported `Class::class` actions, and preserved source offsets. It is not a general PHP parser. For ongoing maintenance, prefer a PHP AST plus an installed application's route registry.

## Domain ownership and coverage

Paths in this table are relative to `/api/v1`. CRUD means list/create/show/PUT/delete unless qualified.

| Task | Records | Families and important operations |
| --- | ---: | --- |
| CORE-01 | 18 | `/search`: accounts, transaction query search, special transaction count. `/autocomplete`: accounts, bills/subscriptions, budgets, categories, currencies, object groups, piggy banks, recurring templates, rules/groups, tags, transactions, transactions-with-meta, transaction types. |
| CORE-02 | 8 | `/accounts`: CRUD; related piggy banks, transactions, attachments. Account types include assets, counterparties and liabilities. |
| CORE-03 | 6 | Transaction read/list/detail: GET `/transactions` and group detail, attachments, piggy-bank events; GET `/transaction-journals/{tj}` and journal links. Journal show resolves to the containing group. |
| CORE-04 | 4 | Transaction editor/splits: POST/PUT/DELETE transaction groups and DELETE journals. Owns group/split write and deletion contracts; no journal POST/PUT is declared. |
| CORE-05 | 11 | `/transaction-links`: CRUD. `/link-types`: list/show/transactions; admin-only create/update/delete. |
| CORE-07 | 17 | `/budgets`: CRUD, no-budget transactions, transactions/attachments; nested limit CRUD and limit transactions. `/budget-limits`: cross-budget list. `/available-budgets`: list/show only. |
| CORE-08 | 16 | `/bills` and `/subscriptions`: same Bill controllers/model; CRUD and related attachments/rules/transactions. |
| CORE-09 | 8 | `/piggy-banks`: CRUD, events, attachments, accounts; multiple account allocations. |
| CORE-10 | 20 | `/categories`, `/tags`: CRUD and related transactions/attachments. `/object-groups`: list/show/update/delete and associated piggy banks/bills; no standalone create. |
| CORE-11 | 7 | `/attachments`: metadata CRUD; binary download and separate raw-body upload. |
| AUTO-01 | 16 | `/rules`: CRUD, expression validation, test, trigger. `/rule-groups`: CRUD, test, trigger, list rules. |
| AUTO-02 | 7 | `/recurrences`: CRUD, explicit trigger, generated transactions. |
| AUTO-03 | 13 | `/webhooks`: CRUD, submit, trigger-transaction, message list/show/delete and attempt list/show/delete. |
| SYS-01 | 30 | `/currencies`: CRUD-related management, enable/disable/primary/default, related objects. `/exchange-rates`: ID/pair/date reads and writes, pair deletion, bulk date/pair entry, upsert. Includes the unresolved declared `currencies.cer` action. |
| SYS-02 | 3 | `/user-groups`: list/show/update administration title and primary currency. No active create/delete/switch/membership routes. |
| SYS-03 | 5 | `/preferences`: list/create/show/update. `/preferences-list`: comma-separated named retrieval. No delete. |
| SYS-05 | 6 | `/users`: admin-only CRUD. `/configuration/{dynamicConfigKey}`: admin-only PUT. |
| SYS-06 | 10 | `/data/export`: accounts, bills/subscriptions, budgets, categories, piggy banks, recurring templates, rules, tags, transactions. CSV download responses. |
| SYS-07 | 4 | `/data/destroy`, `/data/purge`, `/data/bulk/transactions`, `/batch/finish`: destructive maintenance, narrow account reassignment, deferred processing completion. |
| SYS-08 | 6 | `/cron/{cliToken}`, `/about`, `/about/user`, `/release-notes/{version?}`, configuration list/show. Cron uses separate token authentication. |
| ANA-01 | 6 | `/summary/basic`; account, category, budget overview, budget overview-with-limits, balance charts. Actual balance path is `/chart/balance/balance`. |
| ANA-02 | 26 | `/insight/expense` (13), `/insight/income` (7), `/insight/transfer` (6): account/entity/currency aggregates and unassigned buckets. |
| **Total** | **247** | Every active explicit declaration has one planned owner. |

Final CORE-03/04 ownership is split by operation: **CORE-03 = transaction read/list/detail, including all group and journal GET operations (also journal links); CORE-04 = transaction editor/splits, including group/journal POST, PUT and DELETE operations where declared**. Other domain task owners are unchanged. Configuration is deliberately split by method: reads SYS-08, administrative PUT SYS-05. SYS-09 owns user/owner encrypted notification settings and delivery tests in the UI inventory, not SYS-03/04/05; no dedicated notification API operation is invented or reassigned to fill that gap.

Route evidence: `routes/api.php:44–171` system/autocomplete/rates/charts; `:175–317` data/insights/summary; `:321–642` account and financial models; `:645–745` currencies/links/search; `:748–877` system/preferences/webhooks. Full project path: `firefly/firefly-iii/routes/api.php`.

### Aliases retained independently

- Eight `/subscriptions` operations alias `/bills` operations.
- Autocomplete subscriptions aliases autocomplete bills.
- Export subscriptions aliases export bills.
- Expense insight subscription/no-subscription alias bill/no-bill.
- Currency default read aliases primary read.

These are active compatibility routes, not inferred removals or formal deprecations. Object-group related bills and other bill-named relationships are not automatically renamed.

## Authentication, authorization, and deployment

### Frontend sessions and approved native identity handoffs

- Accept both PAT connection and native Passport OAuth. Backend native login/logout, registration/invite acceptance, password reset, MFA, profile/security, client/PAT management and personal CLI-token screens remain trusted handoffs; do not rebuild identity or treat owner `/users` CRUD as self-service identity.
- Keep PATs, OAuth access/refresh tokens and client secrets server-side in the frontend, associated with isolated per-user frontend sessions. Use secure HttpOnly session cookies, frontend CSRF protection, session rotation/expiry and explicit disconnect/logout behavior; no API secrets in browser storage, client bundles, URLs or logs. Verify the connected backend identity, permissions and administration before showing financial data.
- Use server-to-server bearer API calls; frontend and backend domains keep separate native sessions. No shared backend-cookie/session bridge. Native OAuth callback/token contracts must be verified on the unchanged 6.7.9 runtime, including state validation, allowlisted redirect URIs, server-side exchange and protocol-supported protections; do not invent Passport endpoints or PKCE support.
- Safe handoff acceptance requires trusted allowlisted backend links and safe return navigation, correct user context (including mismatched native/frontend users), native CSRF/MFA/blocked-user handling, and revocation/logout isolation. Never append PAT/API/CLI tokens to handoff links. OAuth protocol codes/state and native one-time reset/invitation links stay within validated native flows, with callback/log/referrer redaction; never use an API token as a URL login mechanism.
- Approved identity handoffs can close their scoped acceptance criteria **after testing**, but remain planned/unverified now. Financial old-UI fallbacks and external tools are not full native parity or pre-approved scope reductions. Unsupported financial behavior needs an explicit transparent user scope choice, not backend changes.

### Ordinary API calls

- API guard is **Laravel Passport** (`firefly/firefly-iii/config/auth.php:63–76`), not Sanctum.
- API middleware is `AcceptHeaders`, `auth:api`, `Binder`, `CatchBlockedUsers` (`firefly/firefly-iii/bootstrap/app.php:107–117`).
- Send `Authorization: Bearer <access token or PAT>`. Docs describe OAuth client and personal-token creation through the profile page (`firefly/docs/docs/docs/how-to/firefly-iii/features/api.md:7–18,56–78`).
- Blocked users are rejected (`firefly/firefly-iii/app/Http/Middleware/CatchBlockedUsers.php:22–28`).
- `api-admin` requires the global **owner** role (`firefly/firefly-iii/app/Http/Middleware/IsAdminApi.php:58–66`). Applies to user CRUD, configuration writes, currency create/delete, and link-type create/update/delete.
- The ordinary API middleware does not include browser MFA middleware. OAuth authorization is separately protected by `2fa-check` in `firefly/firefly-iii/routes/web.php:32–42`.
- No general throttle is declared in this API middleware group. Do not infer that proxies or Passport package routes have no rate limits.

Some controllers support `user_group_id`, defaulting to the user's administration and checking membership plus accepted roles. This is not uniformly implemented across all endpoints. Controller `ValidatesUserGroupTrait` rejects an empty accepted-role set, whereas request `ChecksLogin` treats an empty set as login-only. Do not derive a uniform permissions matrix from role arrays alone. Evidence: `firefly/firefly-iii/app/Support/Http/Api/ValidatesUserGroupTrait.php:44–113`; `firefly/firefly-iii/app/Support/Request/ChecksLogin.php:40–72`.

CORS currently permits all origins/methods/headers but disables credentialed requests and exposes no response headers (`firefly/firefly-iii/config/cors.php:39–53`). This is source evidence, not permission to share native browser sessions: the Next.js server makes bearer calls and serves authorized downloads to its own per-user frontend session. Keep download metadata and credentials server-side as appropriate; no backend CORS patch is allowed.

### Adjacent surfaces outside this CSV

OAuth authorization/token endpoints and client/PAT lifecycle are not ordinary versioned resource endpoints. Web routes declare client list/create/update/delete/secret regeneration and PAT list/create/delete under full-auth middleware (`firefly/firefly-iii/routes/web.php:46–68`). Passport also supplies package routes; capture these from the installed runtime instead of guessing their complete set. `/health` and `/up` are operational endpoints outside the CSV (`routes/web.php:109–113`; `bootstrap/app.php:68–74`).

Cron explicitly excludes the API middleware (`routes/api.php:44–53`). The controller checks a CLI token; a matching configured **32-character static token can run for all available users**, while a user token selects that user (`firefly/firefly-iii/app/Api/V1/Controllers/System/CronController.php:45–78`). It is a **side-effecting GET**. Never log/share the token-bearing URL or probe cron during discovery.

## Wire formats, pagination, and errors

### Headers and response shapes

Use `Accept: application/json` or `application/vnd.api+json`; use JSON content type for normal writes. Controller defaults accept those two response types (`firefly/firefly-iii/app/Api/V1/Controllers/Controller.php:68–99`).

Missing/unsupported POST/PUT content type produces **415**; unsupported Accept produces **406**. Raw attachment upload and bulk transactions have content-type exemptions. An optional nonempty `X-Trace-Id` must be UUID-shaped or produces **400** (`firefly/firefly-iii/app/Http/Middleware/AcceptHeaders.php:45–81`).

There is no universal response envelope:

- Model endpoints commonly use Fractal `JsonApiSerializer` resources/paginators (`firefly/firefly-iii/app/Api/V1/Controllers/Controller.php:128–174`).
- Autocomplete and insights can return plain arrays; summary is a keyed object.
- Exports and attachment downloads are binary responses; export filename ends `.csv` (`firefly/firefly-iii/app/Api/V1/Controllers/Data/Export/ExportController.php:187–207`).
- Resource creation often returns **200**, not necessarily 201. Action/delete endpoints frequently return **204**. Do not require a JSON body for every success.
- The `response()->api()` macro adds `Cache-Control: no-store` and echoes a valid trace ID, but not every action uses that macro (`firefly/firefly-iii/app/Providers/AppServiceProvider.php:53–60`).

### Pagination and filtering coexistence

Legacy controller parameter parsing clamps `page` and explicitly supplied `limit` to **1–65,536**, with preference `listPageSize` defaulting to **50**. Invalid legacy dates may be logged and ignored (`firefly/firefly-iii/app/Api/V1/Controllers/Controller.php:181–237`).

New `PaginationRequest` validates page/limit numerically against **1–131,337**, then clamps page to 65,536; sort/filter are model-specific and the default limit still comes from preferences (`firefly/firefly-iii/app/Api/V1/Requests/PaginationRequest.php:50–84`). Account sort/filter allowlists live in `firefly/firefly-iii/config/api.php:28–65`.

Do not apply one global limit cap, query schema, or page-link algorithm to every endpoint. Some lists use fixed large paginator sizes; autocomplete may consume only `limit` rather than offer actual paging. Transaction search reads **query** but constructs paginator URLs with **search** (`firefly/firefly-iii/app/Api/V1/Controllers/Search/TransactionController.php:94–105`): preserve the original query when building page requests until runtime behavior is verified.

### Error decoding

`firefly/firefly-iii/app/Exceptions/Handler.php:103–185` is the primary source:

| Condition | Static response behavior |
| --- | --- |
| Missing resource | 404 with `message` and `exception` |
| Authentication, authorization, OAuth exception | **401**, including permissions failures clients might expect as 403 |
| Laravel request validation | Delegates to Laravel; normally 422 with field-keyed errors |
| Custom validation/number parsing | 422 with `message` and `errors` |
| Header failures | 406 or 415 |
| Unhandled JSON exception | Generally 500; debug mode adds source/trace details |
| Method not allowed | Explicitly mapped to 405 |

Errors are not uniformly JSON:API `errors[]`. Currency disable conflicts may be **409 with an empty array** (`firefly/firefly-iii/app/Api/V1/Controllers/Models/TransactionCurrency/UpdateController.php:72–80,159–166`); attachment upload failures may be **422 with an empty array** (`firefly/firefly-iii/app/Api/V1/Controllers/Models/Attachment/StoreController.php:97–120`).

Creation raises a 410 when a rule deletes the new transaction (`firefly/firefly-iii/app/Api/V1/Controllers/Models/Transaction/StoreController.php:129–131`), but the generic handler only explicitly preserves 405. **Verify effective status at runtime** rather than promising 410 to clients.

## Financial and destructive-operation contracts

### Decimal and currency safety

Keep monetary values as **decimal strings**, and use currency-specific decimal places rather than assuming two. Distinguish object currency, optional foreign currency, and administration primary currency. `pc_*` values mean converted-to-primary; docs say these are null when conversion is disabled. Native amounts remain meaningful and must not be overwritten with converted display amounts. Aggregate output can be grouped by currency and affected by conversion preferences: never sum different currencies blindly.

Evidence: `firefly/docs/docs/docs/references/firefly-iii/api/index.md:17–34`; `firefly/firefly-iii/app/Transformers/AccountTransformer.php:107–139`; `firefly/firefly-iii/app/Api/V1/Controllers/Insight/Expense/PeriodController.php:46–83`.

Non-owner currency updates silently drop code/name/symbol/decimal-place changes (`firefly/firefly-iii/app/Api/V1/Controllers/Models/TransactionCurrency/UpdateController.php:169–174`). Exchange-rate POST upserts an existing date/pair, and the controller checks administration OWNER permissions (`firefly/firefly-iii/app/Api/V1/Controllers/Models/CurrencyExchangeRate/StoreController.php:53–85`).

### Transaction groups and split preservation

**Group IDs and journal IDs are different.** `/transactions` addresses groups. Journal retrieval returns the containing group (`firefly/firefly-iii/app/Api/V1/Controllers/Models/Transaction/ShowController.php:144–152`).

When updating splits, submit every retained `transaction_journal_id`, even unchanged splits. **Omitted splits are deleted. Entries without an ID become new splits.** Do not implement split PUT as a sparse list of changed children. Evidence: `firefly/docs/docs/docs/references/firefly-iii/api/specials.md:5–35`.

Creation requires positive amounts; type/source/destination encode direction. Cross-field validation checks descriptions, types, accounts, foreign currency and group title. Reconciled transactions prohibit changing source, destination, amount and foreign amount; omit these fields. Rules and webhooks default on for ordinary writes and may mutate/delete the transaction. Duplicate-hash rejection is opt-in.

Evidence: `firefly/firefly-iii/app/Api/V1/Requests/Models/Transaction/StoreRequest.php:62–72,99–112,177–204`; `firefly/firefly-iii/app/Api/V1/Requests/Models/Transaction/UpdateRequest.php:225–254`; `firefly/firefly-iii/app/Api/V1/Controllers/Models/Transaction/UpdateController.php:89–100`.

### Other important validation and action constraints

| Domain | Planning constraint and source |
| --- | --- |
| Accounts | Opening balance/date are paired; assets require roles; credit-card roles add payment fields; liabilities add subtype/direction/interest. `firefly/firefly-iii/app/Api/V1/Requests/Models/Account/StoreRequest.php:94–124`. |
| Budgets/limits | Auto-budget reset/rollover/adjusted/none modes have conditional requirements. Limits require positive amounts and strict date ranges; duplicate same-period/same-currency limits are rejected. `firefly/firefly-iii/app/Api/V1/Requests/Models/Budget/StoreRequest.php:75–99`; `firefly/firefly-iii/app/Api/V1/Requests/Models/BudgetLimit/StoreRequest.php:71–123`. |
| Subscriptions | Positive min/max, min ≤ max, schedule and lifecycle date constraints. Distinct from recurring transaction generation. `firefly/firefly-iii/app/Api/V1/Requests/Models/Bill/StoreRequest.php:76–123`. |
| Piggy banks | Use `accounts[].account_id/current_amount`; account type, currency, available-fund and target constraints apply. Not a single-account schema. `firefly/firefly-iii/app/Api/V1/Requests/Models/PiggyBank/StoreRequest.php:73–126`; `firefly/firefly-iii/app/Api/V1/Requests/Models/PiggyBank/UpdateRequest.php:78–92`. |
| Recurrence trigger | Uses a schedule date, generates groups, marks groups as now, restores prior latest-date state. Not simply advancing the schedule. `firefly/firefly-iii/app/Api/V1/Controllers/Models/Recurrence/TriggerController.php:62–83`. |
| Rules | GET test finds matches; POST trigger changes transactions and returns 204. Discover configured actions/operators rather than hardcoding an incomplete list. `firefly/firefly-iii/app/Api/V1/Controllers/Models/Rule/TriggerController.php:70–149`; `firefly/firefly-iii/app/Support/Binder/EitherConfigKey.php:56–64`. |
| Dates | Many validators restrict dates to after early January 1970 and before 2038-01-17. Some allow same-day ranges; others require strict start < end. Day boundaries use application timezone. `firefly/firefly-iii/app/Api/V1/Requests/DateRangeRequest.php:30–45`; `firefly/firefly-iii/app/Api/V1/Requests/SameDateRangeRequest.php:30–45`. |
| Attachments | First create metadata, then upload raw body to `/attachments/{id}/upload`; not multipart. `firefly/firefly-iii/app/Api/V1/Controllers/Models/Attachment/StoreController.php:74–120`. |
| Bulk transactions | `query` is a JSON-encoded string parameter, max 255 characters; only account reassignment via where/update account_id is supported. `firefly/firefly-iii/app/Api/V1/Requests/Data/Bulk/TransactionRequest.php:50–66`; `firefly/docs/docs/docs/references/firefly-iii/api/specials.md:38–57`. |
| Search count | Adds separate external-ID/internal-reference/notes/description counts, potentially overlapping; not the total for generic query search. `firefly/firefly-iii/app/Api/V1/Controllers/Search/TransactionController.php:61–87`. |
| Webhooks | Disabled installations can return 404. Writes require plural triggers/responses/deliveries arrays; singular fields are prohibited. Discover enums through configuration reads. `firefly/firefly-iii/app/Api/V1/Controllers/Webhook/ShowController.php:73–78`; `firefly/firefly-iii/app/Api/V1/Requests/Models/Webhook/CreateRequest.php:70–89`. |
| Batch finish | `apply_rules` is compared to literal string `true`, unlike normal boolean-parsed transaction writes. `firefly/firefly-iii/app/Api/V1/Controllers/System/BatchController.php:73–75`. |
| Preferences | Legacy `currencyPreference` access must use currency routes instead. `firefly/firefly-iii/app/Api/V1/Controllers/User/PreferencesController.php:85–90,127–161`. |

Deletion requires deliberate confirmation. Account deletion supplies no replacement account (`firefly/firefly-iii/app/Api/V1/Controllers/Models/Account/DestroyController.php:59–64`). Maintenance destroy selects whole families and has an unused-account flag (`firefly/firefly-iii/app/Api/V1/Controllers/Data/DestroyController.php:74–138`). Purge permanently removes soft-deleted data (`firefly/firefly-iii/app/Api/V1/Controllers/Data/PurgeController.php:67–115`). Never execute these during inventory generation or read-only discovery.

## Missing workflows and source discrepancies

Distinguish unverified compositions from explicit residual unsupported behavior under the immutable backend. Prove equivalence with existing supported APIs where possible; where required data or mutations cannot be exposed, keep the limitation and any native handoff proposal visible for explicit user scope choice. No backend extension, private web-action bridge, direct DB access or scraping may fill a gap. Financial fallback navigation is not full native parity and is not covered by the approved identity exception.

| Gap | Evidence and planned treatment |
| --- | --- |
| Reconciliation workflow | UI has overview/submission routes (`firefly/firefly-iii/routes/web.php:230–243`); API has reconciliation types/flags but no equivalent dedicated workflow. Coordinate CORE-02/03/04 and CORE-06 rather than claiming parity. Special corrective account/type posting has no established supported API equivalent; retain residual unsupported behavior and any native fallback for explicit user scope choice, never substitute an ordinary transfer. |
| Rich reports | UI has detailed report-data, top/average breakdowns and chart families (`firefly/firefly-iii/routes/web.php:1092–1216`). Five API chart operations plus summary/insights do not establish report parity. Coordinate ANA-01/02 with UI investigation. |
| Piggy add/remove dialogs | UI has explicit actions (`firefly/firefly-iii/routes/web.php:829–839`); API exposes allocations and read-only event listing. Design against the actual allocation write schema. |
| Rule creation helpers | UI creates from a bill/journal and duplicates rules (`firefly/firefly-iii/routes/web.php:1224–1243`); API offers generic CRUD/test/trigger. Verify exact defaults and compose prefill through existing CRUD only where equivalent; otherwise retain a residual unsupported gap. Backend work is forbidden. |
| Self-service auth/profile | Password/MFA/profile and OAuth/client/PAT/CLI-token lifecycle are approved trusted native identity handoffs (`firefly/firefly-iii/routes/web.php:32–68,130–159,859–900`); admin users API is not a substitute. Verify safe linkage and per-user context, not an identity rebuild; approval is not runtime verification. |
| Administration lifecycle | Create/delete/switch/membership declarations are commented out (`firefly/firefly-iii/routes/api.php:359–375`). Only list/show/update belong in exposed coverage. |
| Available-budget writes | POST/PUT/DELETE are commented out (`firefly/firefly-iii/routes/api.php:417–430`), despite broad spec/overlay descriptions. |
| Object-group creation | No standalone POST; create through associated objects (`firefly/firefly-iii/routes/api.php:492–507`; `firefly/docs/docs/firefly-iii.overlay.yaml:108–110`). |
| Declared currency CER action missing | `GET /api/v1/currencies/{currency_code}/cer` at `firefly/firefly-iii/routes/api.php:667` targets `Models/TransactionCurrency/ListController@cer`. No `cer()` definition was found anywhere under backend `app`; target class extends the inspected API base and uses account/transaction filter traits. CSV preserves the declaration with blank controller_line and a warning. Retain as an explicit **residual unsupported source discrepancy** with planned/static-unverified markers. Verify behavior only against the official immutable 6.7.9 image; no backend patch, plugin, custom image or invented endpoint is allowed. Other exchange-rate APIs do not silently repair or close this declaration; any alternative requires an explicit contract comparison and user scope choice. |
| Financial audit/history/rescan gaps | No established supported transaction audit-log read, piggy event-history reset or dedicated subscription rescan contract; see `firefly/frontend/plans/PARITY-GAPS.md` GAP-06. Missing reads/mutations remain residual unsupported; only proven existing-API composition can change that assessment, not web-session automation. |
| Notification side effects | Raw preferences/configuration do not establish encrypted credential persistence or delivery-test equivalence. SYS-09 owns verification and residual gaps; SYS-03 retains preference API operations and SYS-05 owner-panel composition. Native notification forms are not an approved identity handoff. |
| Pagination/search/status discrepancies | Search paginator key differs from request key; multiple pagination validators coexist; raised 410 may be transformed by the custom handler. Track runtime contract tests rather than normalize silently. |

Docs acknowledge exclusive API-backed UI access is still work in progress (`firefly/docs/docs/docs/references/firefly-iii/api/index.md:11`).

## Versioning, deprecation, and specification availability

- URI generation is **v1**; configured application version and exact release target are **6.7.9**. Pin the official original Docker image by immutable digest; another backend version requires a new explicit scope/contract decision. Legacy config `api_version=2.1.0` is explicitly unused (`firefly/firefly-iii/config/firefly.php:81–84`).
- `/about` reports application version in both version/api_version (`firefly/firefly-iii/app/Api/V1/Controllers/System/AboutController.php:46–61`). Do not confuse historical spec version numbers in comments with the runtime version.
- Historical docs mention v2, but active v2 application routes were not found here. Binder names/comments are not exposure evidence.
- No route-level Sunset policy was found in the inspected registrations; internal deprecated methods are not automatically public endpoints. Preserve active aliases.
- Docs link the full `/api/` reference and published `api-docs.firefly-iii.org` release diffs (`firefly/docs/docs/docs/references/firefly-iii/api/index.md:7–15,61–66`), plus separate API-docs/generator repositories (`firefly/docs/docs/docs/explanation/other-tools.md:35`).
- The newest-spec fetch in `firefly/docs/docs/sourcey.config.ts:3–8` is commented out. OpenAPI export is enabled at line 57 and `firefly/docs/docs/firefly-iii.overlay.yaml` exists, but that is not proof of an active generated reference or locally bundled complete spec. Coordinate with docs owner. **No OpenAPI was downloaded or compared during this work.**

## Regeneration and validation plan

1. In an isolated official immutable 6.7.9 container, capture `php artisan route:list --path=api --json` and `php artisan route:list --path=oauth --json` using supported read-only operator execution, without installing dependencies or altering the image. Expand middleware where supported. Keep package routes and implicit methods distinguishable from this explicit source baseline; booting may require supported configuration/services. This is operator contract inspection, not a frontend command runner or DB connection.
2. Parse PHP routes with an AST for ongoing automation. Resolve namespace/prefix/name groups, imported classes, middleware/exclusions and constraints; retain source locations and commented-route exclusions.
3. Join controller actions to request classes, recursive AggregateFormRequest.getRequests(), rules(), withValidator(), conversion/get-data methods, authorization traits, config/bindables.php, model routeBinder() methods, transformers/enrichments and repository side effects. Mark unresolved dynamic contracts rather than inventing schemas.
4. Only when separately authorized/available, obtain a **release-pinned** OpenAPI spec and diff normalized method/path pairs. Normalize placeholder names, not distinct aliases. Record source-only/spec-only/mismatched operations explicitly.
5. Reconcile source declarations with the installed route registry and runtime tests. Prioritize split preservation, reconciled writes, decimal/currency behavior, authorization, paging, action side effects and feature-disabled responses. Never run destroy/purge/cron or delivery triggers as discovery probes.

Validation acceptance for the current artifacts:

- 247 CSV records and unique operation_id values.
- 247 unique explicit method/path pairs; all begin `/api/v1/`.
- Method counts GET 163 / POST 33 / PUT 24 / DELETE 27.
- Every row has a valid canonical task owner and an allowed progress/evidence state. Initial planning snapshot is `planned` / static-only; subsequent progress requires evidence rather than frozen values.
- Every source_line points to the corresponding declaration in the pinned route file.
- 13 aliases resolve to another row with the same method/controller/action/task.
- 246 declared methods found in target controller sources; exactly one known unresolved method, `api.v1.currencies.cer`, retained and flagged.
- No implicit/package/web/commented route falsely counted as an explicit API declaration.
- UI inventory retains 119 unique workflow IDs, valid recorded owners/progress states, plus `disposition` / `disposition_reason` as defined in `firefly/frontend/plans/PARITY-GAPS.md`. `api_supported` is a static mapping, not runtime verification; native identity handoffs start planned and acquire handoff-specific evidence when implemented/tested. Historical language/locale evidence is retained, but the frontend release requires English only, not multilingual/RTL delivery.

The API planning artifacts are `firefly/frontend/plans/inventory/api-operations.csv` and `firefly/frontend/plans/API-REFERENCE.md`; companion parity artifacts are `firefly/frontend/plans/PARITY-GAPS.md` and `firefly/frontend/plans/inventory/ui-workflows.csv`. Future agents follow canonical task claims/write scopes in numbered plans; there is no permanent session-specific 'Main' file owner.
