# Agent instructions — Firefly frontend

This independent repository owns the new frontend **and `plans/`**. Follow `plans/README.md`, accepted decisions in `plans/ARCHITECTURE.md` and the selected task card. `MASTER-PROMPT.md` is the reusable work-session prompt. Read current files/status before editing; plans may have advanced since your conversation started.

## Hard boundaries

- Next.js App Router, React, strict TypeScript, English only, Firefly branding/Verdelo design.
- Original official **Firefly III 6.7.9 Docker image**, unmodified. **Never edit sibling backend/docs/design source, build/patch a custom backend image, add endpoints/plugins, scrape backend HTML, bridge backend sessions/passwords, bypass permissions or access its DB from frontend.** Read-only source inspection is allowed.
- Frontend/backend separate public domains in same Docker Compose; Node mediates existing API using fixed trusted internal upstream. Public native-auth URL, public frontend callback and internal API URL are distinct. No shared backend cookies or assumed browser CORS.
- PAT/native OAuth connection; backend owns login/registration/reset/MFA/profile/security/client/token lifecycle. Approved identity handoffs must be explicit trusted links, no secrets in URLs. Frontend owns secure per-user sessions/connect/disconnect. No global token or secrets in client bundle/localStorage/logs/Git/chat.
- Exact backend coupling in `backend-compatibility.json`. First planned package version `6.7.9-frontend.0.1.0`, release tag convention `v6.7.9-frontend.<major>.<minor>.<patch>`. Verify official image tag/digest, don't invent one. Server enforces exact runtime compatibility; unknown/mismatch fails financial access safely.
- Money decimal strings/currency precision, complete retained split PUT, distinct group/journal IDs, backend-authoritative effects; no automatic write retries or fictional banking/household capabilities.
- Immutable missing financial operations remain explicit unsupported/residual gaps. Native identity handoffs are approved; financial fallback is not full frontend parity or blanket scope waiver. Never mark unsupported/mock-only capability verified.
- Preserve existing repo/user work/plans; no Git reinit/branches/commits/tags/pushes unless explicitly requested. Never overwrite a live Compose stack or run test/destructive operations on production.

## Required task protocol

1. Read task board/card and dependencies plus applicable inventory/source. Run Git status. Claim one eligible `ready` task (or explicitly promote a fulfilled `blocked` one) **before code edits**: set canonical table to `in_progress`, owner/session and real UTC date/time. Respect existing claims; coordinate claims/plan-file updates in a shared worktree.
2. Stable IDs; large tasks get child IDs and canonical rows **before** delegating. Give disjoint write sets. Serialize shared package/lockfiles/nav/tokens/generated schemas/test config/compatibility manifest. Domain modules own local wrappers/tests.
3. Keep changes surgical and verified. Use supplied visual design, mobile/tablet/desktop/a11y states. Test narrowly then broader as appropriate; mock tests do not replace required official-image contract proof.
4. Update canonical status **during work and before ending**: `in_progress`, `blocked` with reason, `in_review` with reviewer/evidence, or `done` only after scoped acceptance passes. `cancelled` needs explicit user scope decision.
5. Append task handoff: owner/timestamps, changed files, acceptance done/remaining, exact test commands/results/environment/evidence, inventory IDs/states/dispositions, blocker and precise next action. Promote newly eligible downstream tasks to `ready`. Never leave a silent unfinished claim or erase others' notes.
6. Final response: task ID/status, concise changes, tests actually run, remaining limitations and next ready task. Do not claim the whole programme is finished because your slice is done.

Canonical statuses: numbered `plans/01…05` task tables. Inventory rows track operation/workflow evidence separately; preserve all 247/119 baseline records and stable IDs. `plans/VALIDATION.md` validates planning only, not the application.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
