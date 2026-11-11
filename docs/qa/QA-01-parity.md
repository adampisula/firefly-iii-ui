# QA-01 — Parity and cross-domain integration audit

Date: 2026-11-11. Backend: official `fireflyiii/core:version-6.7.9`, digest `sha256:d51ab6a3a7b91a5c892441578e0da7f2935f84f36bd1151fc3833acc6e060871`, runtime `/api/v1/about` version `6.7.9`.

## Inventory

- Baseline preserved: **247 API operations / 119 UI workflows** (no rows deleted or re-keyed).
- `node scripts/audit-inventory.mjs` → **0 errors**. Output retained in `inventory-audit.json`.
- Every row has an owner task, status, disposition and reason. Verified rows carry test references and evidence. Unsupported rows never carry `api_supported`.
- Route-surface reconciliation: 247 `/api/v1` routes captured read-only from the container; aliases (`bills`/`subscriptions`) are counted separately and tested as one record.
- `currencies.cer` remains unsupported with live HTTP 500 evidence (`ListController::cer` missing); no workaround was claimed.
- GAP-01 approved native identity handoff; GAP-02 reconciliation and GAP-03 report families residual; GAP-04 notification credentials/delivery residual; GAP-05 invitations/update checks residual; GAP-06 helper/selection/bulk operations residual; GAP-07 installer/recovery operational guidance.

## Supported cross-domain journey (live 38-test integration suite)

`tests/integration/cross-domain-journey.spec.ts` passes: accounts → two-split withdrawal with category/budget/subscription/tag → group read → budget/subscription reads → tag search → rule group/rule → recurrence → six CSV export families, with cleanup. Reconciliation and report-family steps are intentionally excluded and reported as residual, not simulated.

## Limits

- Owner-only writes, enabled webhook paths and notification flows lack a fixture (non-owner PAT / disabled flags).
- Browser UI is exercised against mock/no-session states; connected-session rendering is contract-verified through the live API suite.
- Scoped release only; this is **not** a full native-parity claim.
