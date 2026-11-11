# Master implementation prompt

Paste the block below into an agent with access to this repository. The same prompt can be reused for later sessions; **current task tables, not this prompt's initial ordering, determine what is ready**. For a specific assignment append `Assigned task: <existing task ID>`. Start with **FND-02** for the application scaffold; FND-03 and FND-09 can proceed independently within their documented write scopes. Coordinate claims and shared-plan edits before running multiple agents in one working tree.

```text
You are implementing the Firefly frontend in the existing frontend/ Git repository. Work on an implementation task now, not another high-level plan, and leave durable task progress for the next agent.

READ FIRST
1. AGENTS.md and plans/README.md.
2. plans/ARCHITECTURE.md, plans/DESIGN.md and backend-compatibility.json.
3. The relevant numbered plan (01 foundations, 02 financial workflows, 03 automation/analysis, 04 settings/operations, 05 QA/delivery), its task card/dependencies, plans/API-REFERENCE.md, plans/PARITY-GAPS.md and the matching inventory CSV rows. Inspect current code and Git status; previous sessions may have progressed.
Paths are relative to frontend repo root. Read-only reference clones are ../firefly-iii, ../docs and ../design when present. Evidence paths beginning firefly/ are workspace-qualified. Do not create a nested frontend/frontend directory. Preserve the existing .git, plans and instruction/compatibility files while scaffolding.

ACCEPTED PRODUCT/TECHNICAL CONSTRAINTS — DO NOT REOPEN OR VIOLATE
- Next.js App Router + React + strict TypeScript; English UI; Firefly name with the supplied Verdelo visual system. Clean, accessible and complete at desktop, tablet and mobile sizes. Don't replace it with stock admin-kit styling or import simulated design data/actions.
- Backend is the ORIGINAL OFFICIAL Firefly III 6.7.9 Docker image, in the same Compose stack but on a different public domain. Backend/source modifications are strictly forbidden: no patches/custom backend build/extensions/plugins/new endpoints, no direct backend DB access, no HTML scraping/session bridges/auth bypasses. Reference clones are read-only.
- Browser calls same-origin frontend handlers. Next server uses a fixed trusted Compose-internal backend API URL. Backend public URL is for native UI/OAuth authorization; frontend public URL is for callbacks. Don't assume shared cookies or credentialed CORS across domains. Provide repo-local Docker/Compose examples, not edits to someone's running stack.
- Connect via user PAT or verified native OAuth; backend renders login/registration/reset/MFA/consent/profile/security/token/client management. Do NOT rebuild those identity systems. Implement secure frontend connect/callback/disconnect/session and approved trusted native-identity links. Tokens are per-user and server-side; no global installation token, localStorage/client bundle/URL/log/Git secrets. Disconnect doesn't falsely claim native logout or PAT revocation.
- Exact backend version is 6.7.9, not a broad range. backend-compatibility.json is source of truth. Initial planned package version 6.7.9-frontend.0.1.0; release tag convention v6.7.9-frontend.<major>.<minor>.<patch>. Do not create commits/tags/branches/pushes unless asked. Verify official image release tag/digest and runtime about response; don't invent pins or assume inspection commit proves image provenance. Server-side compatibility checks block financial access and upstream business/operational mutations on mismatch/unknown version; protected frontend connect/callback/disconnect, native identity/help links and compatibility recovery remain available.
- Financial correctness: decimal strings/arbitrary precision and per-currency places; no Number accounting, mixed-currency sums or lost native/foreign/primary distinctions. Group ID differs from journal ID. Split PUT includes every retained split/journal ID or data may be deleted. Backend rules/webhooks can alter/delete writes; refetch authoritative state. No automatic mutation retries or unsupported Undo. No fictional bank/card/household features.
- Aim for all API-supported capabilities and safe proven compositions. Preserve all 247 API and 119 UI baseline inventory rows. Where immutable backend lacks an operation, record unsupported/read-only/residual gap and evidence; do not invent endpoints or mark mocks verified. Native identity handoffs are approved. Native financial fallback is not full frontend parity or automatically approved scope reduction: classify it, ask a precise question if a choice is required, and continue independent supported work. Split supported work from residual children so gaps don't deadlock the whole UI. Never claim full replacement parity while gaps remain.
- English only; currency/date precision/formatting and permissions still matter. Don't build a multilingual/RTL platform, embedded import engine or second accounting engine. Respect design-asset provenance/publication checks.

SELECT AND CLAIM WORK
- If an Assigned task ID was provided, inspect that task first. Otherwise select the first appropriate unclaimed ready task with satisfied dependencies. Initially FND-02, FND-03 and FND-09 are ready; later always consult live tables.
- Recheck task claim immediately before writing. Claim by editing its canonical status table to in_progress with your owner/session ID and real UTC timestamp BEFORE code edits. Never overwrite another agent's claim/work. In a shared worktree coordinate claims/plan edits; text edits are not an atomic lock.
- A blocked task becomes ready only after its named gates are fulfilled. Don't mark prerequisites done to bypass them. If the assigned task truly cannot proceed, record the blocker/next action rather than silently implement another task.
- Work on one bounded task or declared child. For a multi-session/parallel split, add stable child IDs/rows, dependencies, acceptance and disjoint write scopes before delegation. Coordinate shared package/lockfiles/nav/token CSS/test config/generated schema/compatibility-manifest edits; don't race them.

IMPLEMENT AND VERIFY
- Read relevant existing files/source contracts before changes. Implement the task's scoped outputs and tests with minimal focused code; preserve unrelated work. No placeholders/fake production success, insecure shortcut or speculative abstraction.
- Run focused lint/type/unit/component tests and appropriate browser/integration/build checks. Live backend tests use disposable official pinned image, isolated volumes and local notification/webhook sinks only. Never test cron/purge/destructive writes on production. If tools/runtime/secrets are unavailable, report exactly what is unverified and leave required verification blocked.
- Keep loading/empty/error/permission/disabled states, keyboard/focus, safe mobile layout and supplied light/dark/glass/frost behavior. Interface text English, precise finance/date behavior maintained.

MANDATORY STATUS/HANDOFF UPDATES
- During work and BEFORE ending, update the canonical numbered-plan table: in_progress for resumable active work, blocked with exact cause, in_review with reviewer/independent-check evidence, done only when scoped acceptance is actually met. Cancelled requires explicit user scope decision. Don't leave a silent in_progress task or mark a parent done with unmet required-acceptance children. Exception: a parent explicitly re-scoped to a tested supported slice may be done while separately owned, documented non-blocking residual-gap children remain open; preserve their unsupported/unverified inventory evidence and release-scope gate.
- Append under the task card:
  Owner/session and claimed/updated UTC timestamps
  Current status and supported/residual scope
  Changed files
  Acceptance checks completed and remaining
  Exact test commands/results/environment and evidence paths (never claim unrun tests passed)
  Inventory operation/workflow IDs updated, states/dispositions, unsupported gaps retained
  Blockers/decisions and precise next resume action
  Newly eligible tasks promoted to ready
- Update matching CSV evidence/status/disposition without renumbering/deleting records. planned is not implemented; implemented is not verified; a safe tested approved identity handoff has its own disposition, not fake native API coverage. Planning validation isn't application test evidence.
- Re-read downstream dependencies and promote newly eligible tasks to ready; preserve existing notes/claims. End with task ID/status, concise changes, checks actually run, limitations and next ready task. Stop after the bounded assignment is complete or a real blocker is documented; don't launch the whole programme unprompted.

Begin by stating which task you are claiming and the narrow acceptance checks you will use, then perform the work.
```

## Optional assignment suffix

```text
Assigned task: FND-02
Implement only this task's scope. Preserve the repository's plans/instructions/compatibility manifest. Do not commit or scaffold into a nested frontend directory. Update the canonical status and handoff before ending.
```
