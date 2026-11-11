# QA-02 — Responsive, visual and WCAG AA evidence

Date: 2026-11-11. Executed in Chromium (headless) via Playwright.

- Boundary widths **320, 390, 759, 760, 761, 768, 1024, 1179, 1180, 1181, 1280, 1440** pass no full-page horizontal overflow; mobile bottom navigation appears at ≤760px and the desktop rail at >760px (`tests/qa-responsive.spec.ts`).
- Zoom/reflow test at 640px viewport passes.
- Axe checks cover shell, connection, search, accounts, transactions, budgets, subscriptions, piggy banks, classification, attachments, insights, rules, recurrences, webhooks, exports, preferences, maintenance, administration, users, security and reports routes. All reported zero violations in the executed suites.
- Keyboard checks cover skip link, mobile More dialog with Escape and return, appearance dialog, search/form controls and confirmation dialogs.
- Contrast is tested for panel/body text in light/dark at frost 0, 0.5 and 1 (`tests/app.smoke.spec.ts`).
- Reduced transparency is honoured via the opaque-surface attribute and CSS; the appearance control persists browser-only values.
- Visual review uses the implemented screens, not the component gallery alone. Intentional adaptations: mobile More pattern, data-table chart equivalents, English-only UI.

## Disclosed limits

- Firefox and WebKit engines were not installed/run; physical devices and screen readers (NVDA/VoiceOver) were not available. These remain lower-risk follow-ups for signoff, not claimed as tested.
- No screenshot-baseline suite is configured; no visual-regression pass is claimed.
