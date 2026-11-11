# Runtime contract evidence — FND-08-b

Captured **2026-11-11** against the isolated official Firefly III image `fireflyiii/core:version-6.7.9` (digest recorded in `../backend-compatibility.json`) at loopback `127.0.0.1:8089`. This is operator runtime evidence for the immutable backend boundary; it is not a deployment certification and it does not authorize backend changes or direct database access.

## Environment and provenance

- Image: `fireflyiii/core:version-6.7.9`, running healthy, `VERSION=v6.7.9`.
- `/api/v1/about` with a disposable PAT: `data.version` and `data.api_version` are both `6.7.9`.
- Route surface captured read-only by bootstrapping the Laravel router inside the container without instantiating controllers: **247 `/api/v1` routes**, matching the inventory baseline.
- OAuth package routes are present (`/oauth/token`, `/oauth/authorize`, `/oauth/device`, `/oauth/token/refresh`, device authorization); no client credentials were provisioned for this session, so the full OAuth code/refresh flow remains unverified here.
- The test PAT is a disposable local fixture and is not stored in this repository.

## Verified safe read surfaces

All requests used a disposable PAT, `Accept: application/json`, and no writes except the split lifecycle described below.

| Surface | Result |
| --- | --- |
| `GET /api/v1/user-groups` | 200 |
| `GET /api/v1/configuration` | 200 |
| `GET /api/v1/release-notes` | 200 |
| `GET /api/v1/transaction-links` | 200 |
| `GET /api/v1/recurrences` | 200 |
| `GET /api/v1/rules` | 200 |
| `GET /api/v1/preferences?limit=100` | 200 |
| `GET /api/v1/summary/basic?start=…&end=…` | 200 |
| `GET /api/v1/chart/balance/balance?start=…&end=…` | 200 |
| `GET /api/v1/insight/expense/total?start=…&end=…` | 200 |
| `GET /api/v1/data/export/accounts` | 200 (CSV) |
| `GET /api/v1/webhooks` | 404 when the feature flag is disabled; routes exist in the registry |
| `GET /api/v1/currencies/EUR/cer` | **500** `Method FireflyIII\Api\V1\Controllers\Models\TransactionCurrency\ListController::cer does not exist` |

Missing aggregate date parameters produce 422, not empty success. Webhook 404 is a feature-disabled state and must be shown as such, not converted into an invented empty webhook list.

## Split and journal identity probe

- Created one asset account, one expense account and a two-split withdrawal group through existing API routes.
- Read back distinct group and journal identities; the group ID and `transaction_journal_id` values are different identifiers.
- `PUT /api/v1/transactions/{group}` with every retained `transaction_journal_id` updated one split amount and description.
- Re-read retained both journal IDs and both amounts. Firefly returned amounts in 12-decimal form (`11.000000000000`, `5.000000000000`), confirming that clients must use decimal strings and currency precision rather than `Number` formatting.
- Transaction search retained the original query in pager links.

## Gap classification

| Gap | Runtime classification | Evidence and remaining limit |
| --- | --- | --- |
| GAP-01 identity/profile/OAuth | **Approved native identity handoff** for login/registration/reset/MFA/profile/PAT/OAuth-client lifecycle. PAT session works server-side. | 247 API routes and OAuth package routes exist; PAT connect and `/about/user` verified. Native OAuth code/refresh flow, MFA screens and reset/invitation emails remain untested because no OAuth client/SMTP fixture was configured. Hosted links must be allowlisted and never carry tokens. |
| GAP-02 reconciliation | **Residual unsupported** for the dedicated workflow, including the special corrective transaction. | No reconciliation route exists in the 247-route API surface. Ordinary transaction edits cannot reproduce statement matching, computed mismatch or the special correction type/account without inventing behavior. Keep visible as unsupported and propose a native fallback only with explicit user scope choice. |
| GAP-03 reports | **Partially supported inputs; report families residual unsupported.** | `summary/basic`, five chart families and insight aggregates respond. No `/report` route or report-data family exists, so legacy builder tables/series, audit before/after balances and combined counterparty matrices cannot be claimed as parity. |
| GAP-04 preferences/notifications | **Ordinary preferences supported; notification encryption/delivery residual unsupported.** | `/preferences` read/write works and FND-06 stored `frontpageAccounts` and optional fields. No notification-credential or delivery-test endpoint exists; do not store channel secrets as plain preferences. |
| GAP-05 owner invitations/update checks | **Partial API support; invitations and manual update checks residual unsupported.** | Owner `/users` CRUD and `/configuration` exist. Invitation email/token states and update-check results have no API operation; admin-only probes were not run because the disposable user has no owner role. |
| GAP-06 helpers (rescan, audit, clone, bulk, rule helpers, recurrence helpers) | **Generic CRUD supported; dedicated helpers residual unsupported.** | No rescan, audit-log, clone, mass/bulk-editor or unscheduled-rule-test route exists. Split-preserving update is proven. Recurrence trigger and CRUD routes exist; calendar/suggestions and recurrence-from-journal have no dedicated route. |
| GAP-07 installer/recovery/help | **Operational/approved native guidance; release-notes read supported.** | Installer, recovery and native diagnostics are web/operator flows, not API-mediated. `/release-notes` responds; it is not a manual update check. |

## Limits

- No cron execution, purge, destructive maintenance, notification delivery, webhook trigger, or reconciliation probe was run.
- Owner-only writes and invitation flows are not verified with the current non-owner disposable user.
- The image digest and `/about` version are verified for this local container only; production certification still requires the deployment to repeat the check.
- Runtime results do not convert any unsupported financial join into a supported one. Backend extensions, scraping and DB shortcuts remain forbidden.
