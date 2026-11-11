# Planning-artifact validation

Updated **2026-11-11** after user decisions and moving the plans into `frontend/plans/`. Validates this planning handoff only; not an application-test or full-parity success report.

## Current checks passed

A read-only Python 3 validation command run from the `firefly/` workspace parsed all five canonical task tables, both CSVs, Markdown links and root compatibility JSON:

- **46 canonical tasks**: **2 done** (source research and recording decisions), **3 ready** (FND-02 scaffold, FND-03 design preparation, FND-09 coverage tooling), **41 blocked** by implementation prerequisites. No application features marked done.
- Unique IDs and valid explicit dependency references. Slash-shortened dependencies and BASE expanded; **46-node explicit graph has no cycles**. QA aggregate/supported-slice gates remain additionally defined in prose.
- **247 API operation IDs and method/path pairs unique**: GET 163 / POST 33 / PUT 24 / DELETE 27. All owners resolve, source declaration lines exist, initial rows remain `planned` and source-only verification. The baseline is not a permanent cap; runtime/spec differences are future work.
- **119 unique UI workflow IDs**, valid owners and source path/line ranges, all initial statuses `planned`. Each now has `disposition` and `disposition_reason`: 48 API-mapped, 45 requiring contract verification, 10 residual unsupported scope choices, 12 approved identity handoffs, 1 historical language workflow, 1 external-tool and 2 operational-guidance rows. Disposition is not evidence of implementation.
- All Markdown relative links resolve; no obsolete pre-move plan paths remain.
- Root `backend-compatibility.json` parses: exact 6.7.9/API v1, backend modifications forbidden, English, planned frontend version `6.7.9-frontend.0.1.0`. Official image tag/digest/runtime verification remain explicitly unset/unverified, not fabricated.
- Source `/about` response shape checked in `firefly/firefly-iii/app/Api/V1/Controllers/System/AboutController.php:53–61`: application version is `data.version`. Runtime verification remains FND-08 work.

Read-only independent review caught and corrected: transaction-delete/CLI-token ownership in initial planning, missing shared English/message foundation, supported-parent vs residual-child completion semantics, compatibility recovery exceptions, frozen inventory-state wording and temporary session-specific ownership restrictions. Current reusable instructions require canonical claims/status updates and durable resume notes, with live ownership rather than a permanent 'Main' agent.

Static API inspection found **246 declared controller methods** and one unresolved `currencies.cer` action. The existing target class lacks a found `cer()` method; on immutable backend this is an unsupported discrepancy to verify/report, not permission to patch it.

## User decisions now resolved

Next/React/TypeScript; same Compose/separate public domains; original official backend image unchanged; PAT/native OAuth and native identity screens; English/exact 6.7.9/direct version coupling; Firefly branding/Verdelo style; existing independent frontend Git repository. Plans, AGENTS, master prompt, root README and compatibility manifest now live inside that repo. No Git commits/branches/tags created.

Remaining inputs are deployment/publication checks, not reasons to re-ask architecture: real URLs/secrets and OAuth registration, official image tag/digest provenance and runtime availability, design/font/icon/scene license review. Missing financial capabilities still require explicit residual reporting/user scope choice when proven impossible; approval of identity handoffs is not blanket financial scope waiver.

## Not performed

- No app scaffold/dependency installation/unit/e2e build or application runtime validation.
- No backend/API/OAuth requests, migrations, cron, external delivery or destructive writes.
- No OpenAPI download/compare, Docker pull/digest certification, browser/a11y/contrast/device certification.
- Source/CSV checks are snapshot checks, not a durable PHP AST parser/field audit/drift monitor. FND-09 owns durable tooling, FND-08 official-image verification. Future implementing agents update progress/evidence states; the initial `planned` markers are not frozen requirements.

Record actual implementation command/results/environment under each claimed task before changing its acceptance state. A missing runtime or secret means unverified checks stay blocked; do not fill gaps with mock success.
