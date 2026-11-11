# Firefly frontend — implementation handoff

Updated **2026-11-11** after user decisions. This is the canonical planning directory **inside the independent `frontend/` Git repository**. No application scaffold exists yet. Start with [`../MASTER-PROMPT.md`](../MASTER-PROMPT.md); agents must follow [`../AGENTS.md`](../AGENTS.md).

## Accepted requirements

- **Next.js App Router + React + strict TypeScript**, Node server-side API/session boundary.
- Frontend and Firefly III are in the **same Docker Compose deployment with separate public domains**. Browser uses same-origin frontend handlers; handlers call trusted internal backend URL. Public backend URL is used for native UI/OAuth authorization; never assume shared cookies/CORS just because Compose networking works.
- **Unmodified original official Firefly Docker image only. No backend/source changes, custom image, added endpoints, plugins, patches, direct DB shortcuts or scraping/session bypasses.** Sibling `../firefly-iii`, `../docs`, `../design` (relative to frontend repo root) are read-only evidence.
- PAT and native OAuth are accepted connection methods. **Do not rebuild Firefly login/registration/reset/MFA/profile/security/token/client management**; trusted native UI handoffs are approved. Frontend handles secure connect/callback/disconnect/session, not passwords or MFA secrets.
- Exact **Firefly III 6.7.9**, API URI v1, **English only**. Version new frontend releases as `6.7.9-frontend.<major>.<minor>.<patch>`; initial proposal `6.7.9-frontend.0.1.0`. See [`../backend-compatibility.json`](../backend-compatibility.json) and ARCHITECTURE. Actual image tag/digest must be verified; never invent them. No tag/commit has been created.
- **Firefly** branding with supplied **Verdelo visual style**, clean/responsive/accessible at desktop/tablet/mobile sizes. Keep amount precision, currencies/date formats, permissions and destructive safeguards. Asset rights remain a publication review, not consent assumed from branding.
- `frontend/` owns code/config/plans; repo already exists. Preserve `.git`, planning files and user work during scaffold. Do not reinitialize Git or commit/branch/push unless requested.

## Completeness under immutable backend

Original goal remains the union of usable default-UI and API capabilities, **subject to these accepted constraints**. All **247 API operation rows** and **119 workflow rows** stay in inventories; no deleting hard cases to make percentages green.

Identity handoffs are explicitly approved and may be verified when safe/working. Other missing financial/report/reconciliation/helper operations require proof of a safe existing API composition. If impossible, record `unsupported`/read-only limitations or a **proposed**, clearly labeled native-UI fallback and ask for a scope choice when needed. Do not treat approved auth handoffs as blanket permission to send every financial screen back to old UI. An impossible original capability is not implemented; no claim of full replacement parity while residual gaps exist.

Supported slices may finish independently of unsupported residual children; final release reports capability/compatibility honestly. FND-08 classifies gaps instead of adding forbidden endpoints. See [PARITY-GAPS](PARITY-GAPS.md), inventory `disposition`/reasons and per-card scope notes. Mocks are not runtime proof.

Not requested: actual bank payments, card issuance/freezing/CVV, unfinished household sharing, embedded Data Importer engine, native/offline apps, additional translations/RTL certification, a second accounting engine, or speculative multi-backend-version adapters.

## Plans and references

| Document | Scope |
| --- | --- |
| [01 Foundations](01-foundations.md) | Decisions, scaffold/versioning/Compose, design, client/PAT/OAuth, shell/onboarding, fixtures/coverage and English message basics |
| [02 Financial workflows](02-financial-workflows.md) | Accounts/search/transactions/splits/reconciliation, budgets/subscriptions/piggy, classification/files |
| [03 Automation/analysis](03-automation-analysis.md) | Rules, recurrences, webhooks, dashboard/insights and report families |
| [04 Settings/operations](04-settings-operations.md) | Currencies, administrations/preferences, native identity handoffs, admin/notifications, exports/maintenance/system |
| [05 Validation/delivery](05-validation-delivery.md) | Contract/capability audit, responsive/a11y, English/financial dates, security, exact-version deployment/release |
| [Architecture](ARCHITECTURE.md) / [Design](DESIGN.md) | Accepted technical boundary and visual contract |
| [API reference](API-REFERENCE.md) / [Parity gaps](PARITY-GAPS.md) | Source-grounded protocol/domain facts and missing/partial workflow contracts |
| [API inventory](inventory/api-operations.csv) / [UI inventory](inventory/ui-workflows.csv) | Stable IDs, owners, source references and evidence-level progress |
| [Validation](VALIDATION.md) | Planning checks and limits; not application-test success |

## Read/claim/implement/resume protocol

1. Read `AGENTS.md`, this file, ARCHITECTURE, DESIGN, API-REFERENCE/PARITY-GAPS and the applicable task card/inventory rows. Inspect actual current code and Git status before editing; earlier agents may have progressed.
2. Find a `ready` task, or promote a `blocked` task **only after its named prerequisites are satisfied**. If given a task ID, use it rather than silently switch scope. Claim in the canonical table: `in_progress`, owner/session and real UTC date/time. There is no competing master task-status board.
3. Work only assigned files/scope; split big tasks into stable child IDs/table rows before delegation. Preserve all task/inventory IDs even when ownership changes. Declare disjoint write sets. Serialize shared package/lockfiles, nav registry, token CSS, generated API and shared test setup.
4. Add tests and run narrow checks then appropriate broader checks. Record exact commands/results/environment and test evidence. Never mark `done` on mock-only proof where task requires live contract verification, or claim unrun tests passed.
5. Update task status as work progresses and **before yielding**: `in_review` with review evidence/reviewer, `done` only when scoped acceptance passed, `blocked` with exact reason/next action when unable to continue. A task spanning sessions needs a durable handoff, not status-only edits.
6. Update individual CSV states/evidence as appropriate, including disposition/residual limitation. `verified` requires actual relevant checks; approved handoff needs safe trusted navigation testing, not just a markdown link. Unsupported backend defect is never a passing client implementation.
7. Re-evaluate dependent rows and promote those newly eligible to `ready` in the same handoff. Do not start all remaining work unprompted or leave completed prerequisites blocking ready work forever.

Task states: `ready → in_progress → in_review → done`; `blocked` can enter/leave with documented reason and fulfilled gates. `cancelled` needs explicit user decision. A dependency means task done unless explicitly identified as an accepted-decision gate or a supported-slice dependency. Initial `blocked` means future prerequisites, not a failed implementation.

Append under the task card:

```text
Owner/session: ... | claimed UTC: ... | updated UTC: ...
Status and scope: supported slice / residual child / complete task
Changed files: ...
Acceptance completed / remaining: ...
Checks: exact command, result, environment, evidence path
Inventory: operation/workflow IDs, states, handoff/unsupported disposition
Blockers/decisions: precise cause; never solve by modifying backend
Next action: concrete resume step
Newly ready tasks: ...
```

If independent agents share one working tree, a table claim is not an atomic lock: coordinator serializes claims/shared-plan edits, agents re-read claim state immediately before writing, and collisions stop for resolution. Do not overwrite stale copies of whole status tables. Separate branches/worktrees need explicit user authorization; no implicit Git automation.

## Start now and sequencing

**Ready now:** FND-02 scaffold/version enforcement/Compose skeleton, FND-03 design preparation, FND-09 inventory/schema/compatibility tooling. FND-01 decision recording is done. No actual features are marked implemented.

- FND-02 owns root/package/config/compatibility/Compose changes. FND-03 initially owns its design audit and then token/assets paths in agreement with scaffold, not package files. FND-09 owns inventory/validator/schema provenance and coordinates root version-helper changes with FND-02.
- After scaffold: FND-04 transport/financial helpers, FND-07 harness, FND-11 minimal English messages; then isolated official-image fixture `FND-08-a`, auth `FND-05`, runtime/gap classification `FND-08-b`, primitives `FND-10`, shell `FND-06` according to exact gates. PAT makes connection development straightforward; OAuth uses native backend identity.
- First working vertical slice: accounts, transaction reads/editor, search and overview; prove real seeded backend semantics, then parallel disjoint financial/automation/settings features.
- Financial gaps remain explicit residual work without preventing all supported screens. Final QA reports exact backend image/version and supported native frontend operations vs approved identity handoffs vs residual limitations.

## Source snapshot and path convention

| Input | Inspection snapshot |
| --- | --- |
| Backend clone | `d65e916130c91d8f13ca808ca088d225ddd9a939`; configured app **6.7.9**; not proof of deployed image build provenance |
| Docs clone | `db3c7b6214e4381b5dc18f26e2b952588e5c3279` |
| Design | Live `design-system.html`, CSS/JS/palette/scenes and supplied images; no revision captured |
| Repository | Existing independent `frontend/.git`, initially no commits; plans/master instructions now inside it |

Paths beginning `firefly/` in evidence are editor-project-qualified: `firefly/frontend/...` is this repo, `firefly/firefly-iii/...`, `firefly/docs/...`, `firefly/design/...` are read-only siblings in workspace. From `frontend/`, use `../firefly-iii`, `../docs`, `../design` for source reads; from `plans/`, they are two levels up. Existing numbered cards may use `frontend/src/...` to mean repo-root `src/...`, not a nested `frontend/frontend/`.

Research was source inspection only; no runtime/API/OpenAPI download/application build executed. Future repo-only clones need the documented optional read-only reference checkout workflow/version provenance; don't copy entire upstream repos into this repo. Credentials belong in local environment/secrets, never chat/Git.
