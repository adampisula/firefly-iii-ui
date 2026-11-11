# QA-06 — Documentation, licensing, rollout and user signoff

Date: 2026-11-11.

- Developer docs: `README`, `docs/TESTING.md`, `docs/DEPLOYMENT.md`, `docs/BACKEND-UPGRADE.md`, plans/ADRs and inventory regeneration commands. `frontend/` is its own git repository.
- Operator/deployment docs cover separate public domains, exact 6.7.9 tag/digest, three URL roles, host-only cookies, callbacks, cron-token handoff, importer boundary, backup/restore and rollback.
- User-facing guidance covers bookkeeping vs bank payments, reconciliation/report differences, privacy, notifications residual and destructive warnings.
- Licensing/provenance: no backend source was reused or patched; no mandatory translation assets. Urbanist/dependency notices are retained via project metadata. Design/scene imagery provenance and any redistribution rights still require owner confirmation; no legal clearance is claimed.

## Release status

- Supported capability report, exact runtime/image evidence, test commands and residuals are recorded in QA-01…05.
- **Pending user action:** approve the scoped release and its residual gaps (reconciliation/report families, notification credentials, owner-only runtime verification, enabled webhook paths, bulk maintenance).
- **Pending user action:** confirm rights/provenance for design/scene assets before public distribution.
- User acceptance on desktop/tablet/mobile and rollback approval must be recorded by the user; an agent does not self-approve.
