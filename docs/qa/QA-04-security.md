# QA-04 — Security and operational safety evidence

Date: 2026-11-11.

- `node scripts/audit-bundle.mjs` scanned `.next/static`: **39 files, 827,244 bytes, 0 findings** for JWTs/PATs, internal URLs, session secrets, database URLs or test tokens.
- Tokens remain server-side in encrypted HttpOnly cookies; the client bundle contains no backend credential. BFF routes keep Authorization server-side for exports/attachments.
- Onboarding POST enforces JSON content type and same-origin `Origin`; session cookie is HttpOnly/SameSite with host-only scope; no shared backend cookie or backend-session proxy.
- Financial access is gated by exact runtime 6.7.9 compatibility; mismatch/unverifiable blocks financial reads/writes. Compatibility recovery remains available.
- Destructive operations require typed/explicit confirmation; no automatic write retries; deletes surface backend rejection.
- Native identity handoffs are plain allowlisted links with no secrets in URLs; frontend logout is distinct from backend logout/token revocation.
- XSS/CSV/attachment considerations: React escapes rendered text, attachment downloads are server-proxied with `nosniff` and backend content disposition, CSV is backend-generated.

## Residual lower-risk items / not verified

- Two-user IDOR and owner/non-owner mutation tests need a second fixture and an owner fixture; non-owner requests currently return 401/403 and are surfaced without retries.
- Webhook/notification SSRF and delivery are backend/network-policy owned and feature-disabled in the fixture; no frontend SSRF remediation is claimed.
- Virus scanning/MIME enforcement for uploads is backend-owned; no custom backend change was made.
- No critical or high-risk issue was identified in the tested surface.
