# Full UI usability rework — real Firefly data, lists/graphs, appearance personalization

## Goal

Turn this alternative Firefly UI into a genuinely usable everyday interface:

- Remove everything that does not exist in a normal Firefly III installation:
  fictional payment cards, card freeze/limits, invented people/balances/notices,
  “safe to spend”, “statement”, “send money”, fake household copy and dead controls.
- Replace the overview with real API-backed data: summary tiles, balance/cash-flow
  graphs, account list, recent transactions, budget/subscription/savings progress.
- Add user-selectable appearance: theme, accent color, custom background image,
  glass intensity and reduced transparency. Background and accent settings sync
  per user through the frontend server, with a browser cache for first paint.
- Rework every domain page into the same list/graph/table language, with responsive
  and accessible states, without adding backend endpoints or changing the official
  Firefly III 6.7.9 image.

## Decisions already made

| Decision           | Choice                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| Scope              | Full app visual rework, not only the overview.                                                               |
| Background storage | Sync per user via the frontend server, not browser-only.                                                     |
| Accent control     | Accessible presets plus a custom hex value with contrast validation.                                         |
| Overview data      | Real API data only. No demo figures for logged-in or logged-out users.                                       |
| Visual direction   | Keep the Verdelo glass identity, but make content denser and list/graph-first.                               |
| Dependencies       | Prefer existing React/CSS/SVG. Do not add a chart library or image-processing dependency unless unavoidable. |

## Constraints

- Do not edit, patch or rebuild the Firefly backend, its database or its sessions.
- Keep the official `fireflyiii/core:version-6.7.9` image unmodified.
- The browser talks only to the frontend origin. The frontend server calls the
  trusted internal API URL. Native identity links use the public backend URL.
- No financial data, tokens or appearance images in logs or Git.
- No new backend endpoints. Appearance storage is a frontend-only BFF feature.
- No fake fallback values. Missing data must show an empty/unavailable state.
- Preserve decimal strings and currency precision. Never sum across currencies.
- All amounts must go through `MoneyDisplay` so privacy mode and formatting apply.
- Preserve existing supported mutations and their confirmation/error behavior.
- Update canonical `plans/` task cards and inventory only after the implementation
  slice is actually verified.

## Inspection notes

- Deployed frontend: `https://firefly.services.lan` (HTTP inspection during
  planning showed CSS chunks and `/fonts/urbanist.css` returning 200).
- Native backend public URL currently rendered as
  `https://firefly-core.services.lan`; fallback if unavailable is
  `http://ubuntu-host.lan:8081`. Do not use the internal API URL in browser links.
- The browser-run MCP was not exposed in the planning session. Implementation must
  perform visual QA in a real browser against the deployed frontend and backend.
- `.dev_token` is gitignored and contains a development PAT. Use it only through
  the connection form or disposable local tests. Never print, commit or paste it.
- Current overview is static: `src/features/overview/overview-dashboard.tsx`
  contains invented cards, people, balances, notices and forecasts.
- Current shell contains fake fallbacks and dead controls:
  `src/components/shell/app-shell.tsx` (`Ines Okafor`, `Okafor–Lindqvist home`,
  `Safe to spend today`, hardcoded transaction count, non-functional notification
  button, duplicate “Send money” actions).
- Current appearance only stores theme/frost/reduced transparency:
  `src/lib/appearance.ts` and `src/lib/appearance-store.ts`.
- Current `summary.basic` mapper expects `value`, but the documented response uses
  `monetary_value` and `title`; fix this while building the real overview.

## Target information architecture

Use these groups in `src/lib/nav.ts`:

- **Overview**: Overview
- **Money**: Accounts, Transactions, Search
- **Planning**: Budgets, Subscriptions, Savings goals
- **Organize**: Categories, Attachments, Link types
- **Automation**: Rules, Webhooks, Recurrences
- **Analysis**: Insights, Reports
- **System**: Currencies, Preferences, Users, Administration, Settings, Export,
  Notifications, Maintenance, Help

Mark the overview as `available`, not `planned`. Bottom navigation on mobile:
Overview, Accounts, Transactions, Budgets, More.

## Target overview

Only render after a verified session and configured administration. If not
connected, show the connect form and an honest product explanation; never render
the sample dashboard.

Sections, in order:

1. **Page header**: real user name/email, current date range label, primary action
   “New transaction”, secondary “Search”.
2. **Summary tiles**: net worth, balance, spent, earned, left to spend, unpaid
   bills. Use summary keys such as `net-worth-in-EUR`, `balance-in-EUR`,
   `spent-in-EUR`, `earned-in-EUR`, `left-to-spend-in-EUR`,
   `bills-unpaid-in-EUR`. Group by currency and never add unlike currencies.
3. **Balance chart**: `chart.balance.balance` over the selected range. Include an
   accessible data table and a text summary.
4. **Cash flow**: income vs expense bars from `insight.income.total` and
   `insight.expense.total`, plus the balance trend. Include the equivalent table.
5. **Accounts list**: active asset/liability accounts with balances, type/role and
   links to account detail. Honour `frontpageAccounts` preferences when present;
   otherwise show all active asset/liability accounts.
6. **Recent transactions**: latest groups from `transactions.index`, with amount,
   date, type, account, category/budget and links. Do not sum split groups again.
7. **Budget progress**: active budgets for the range with spent and limit where
   available. If limits require per-budget calls, fetch a bounded top set (for
   example six) and link to `/budgets` for the rest.
8. **Upcoming subscriptions**: bills sorted by `nextExpectedMatch`, with amount
   range, frequency and due date.
9. **Savings goals**: piggy banks with current amount, target and percentage.

Partial failure rule: load independent sections with `Promise.allSettled` so one
unavailable endpoint does not blank the whole overview. Show the failed section’s
honest error state next to the successful sections.

## Implementation tasks

### Phase 0 — Shared foundations and serialized files

1. Refactor accent tokens in `src/styles/tokens.css`:
   - Introduce `--accent-base` (green in light, mint in dark, including the
     `prefers-color-scheme` block).
   - Derive `--accent`, `--accent-hi`, `--accent-soft`, `--accent-wash`,
     `--accent-line`, `--accent-glow` and `--on-accent` from `--accent-base`
     where possible.
   - Add an `--app-bg-image` variable with the existing room scene as fallback.
   - Keep the seven registered palette literals as the default base colors.
2. Replace direct accent-color uses that bypass `--accent` (for example
   `.button-link`, brand gradients, chart strokes) with semantic accent tokens.
   Keep `--good`, `--warn`, `--bad` semantics independent of the user accent.
3. Remove the public-directory CSS import from `src/app/globals.css`. Load
   `/fonts/urbanist.css` explicitly from the root layout with a `<link>` so font
   CSS resolution does not depend on importing from `public/`.
4. Define shared appearance types and pure validation in
   `src/lib/appearance.ts`: theme, frost, reduced transparency, accent preset,
   custom hex, contrast result, background metadata and a versioned storage shape.
5. Define accent presets with light/dark values and a contrast helper. Reject a
   custom accent unless black or white text reaches at least 4.5:1.
6. Update `src/lib/nav.ts` to the target information architecture and correct
   `BOTTOM_NAV_LINKS`. Keep stable link IDs where possible.
7. Add shared UI building blocks in `src/components/ui/`:
   - page header (eyebrow, title, lede, actions)
   - stat tile / stat grid
   - responsive data list/table wrapper with mobile labels
   - bar chart and line/area chart with `role="img"`, text summary and
     `ChartDataTable` fallback
   - progress list
   - filter toolbar
   - honest empty/permission state helper
     Reuse the existing `MoneyDisplay`, `Status`, `Dialog`, `Pagination` and
     `ChartDataTable` rather than duplicating them.

Serialization: one owner must finish `tokens.css`, `globals.css`, `nav.ts`,
`app-shell.tsx`, `primitives.tsx`, `primitives.module.css`, `package.json` and the
appearance module before parallel domain-page work starts.

### Phase 1 — Truthfulness and shell cleanup

1. Delete the sample data and fake interactions from
   `src/features/overview/overview-dashboard.tsx`. Replace it with either the real
   overview component or remove the file if the new overview lives elsewhere.
2. In `src/app/(app)/page.tsx`, render:
   - connect landing when there is no session;
   - compatibility/setup errors as today;
   - the real overview when configured.
3. In `src/components/shell/app-shell.tsx`:
   - brand as “Firefly”, not “Verdelo” or a fictional household;
   - use real session user data; no “Ines Okafor” or invented role/email;
   - remove “Safe to spend today” and all fake sidebar figures;
   - remove the hardcoded transaction count badge;
   - replace “Send money” with “New transaction” and remove the fake
     “Statement” button;
   - make the notification control link to `/notifications` or remove it;
   - keep native profile/token/MFA links and the separate-session explanation;
   - make the quick appearance dialog link to the full Settings appearance
     section.
4. Update `src/app/(app)/[section]/page.tsx` and the remaining “Soon”/planned
   states so only genuinely unavailable sections say so. Available pages must not
   advertise themselves as planned.
5. Remove obsolete wallet/card/noticed/sparkline/flow CSS from
   `src/app/globals.css` after the new overview no longer uses it. Keep shared
   panel, button, badge, table, meter and form styles.

### Phase 2 — Real overview service and mapping

1. Create `src/features/overview/service.ts` (or `features/dashboard/` if kept
   consistent with the ANA-01 plan). Export a typed `OverviewData` containing:
   summary entries, balance series, income/expense series, accounts, recent
   transactions, budgets/limits, bills, piggy banks, selected range and any
   section errors.
2. Fix `mapSummary` in `src/features/analysis/service.ts` to accept the real
   `BasicSummary` shape:
   - object keyed by summary key or an array of entries;
   - `monetary_value` and `value`;
   - `title`, `currency_code`, `currency_symbol`, `currency_decimal_places`,
     `sub_title`, `no_available_budgets`.
3. Add a bounded loader using existing services:
   - `getSummary`
   - `getChart("chart.balance.balance", start, end)`
   - `getInsight("insight.income.total", start, end)`
   - `getInsight("insight.expense.total", start, end)`
   - `listAccounts`
   - `listTransactions` with a small limit
   - `listBudgets` plus bounded `listBudgetLimits`
   - `listBills`
   - `listPiggyBanks`
   - preferences for `frontpageAccounts` where available
4. Use `rangeFromKey` from the shell’s `?range=` value. Show the exact date range
   and currency scope on the dashboard.
5. Build the dashboard components with the shared stat/chart/list primitives.
   Replace the old `ov__wallet`, `ov__balance`, `ov__flow`, `ov__where`,
   `ov__recent`, `ov__side` layout with a responsive grid:
   - full-width summary strip;
   - two-column charts on desktop, single column on mobile;
   - accounts and recent transactions as full-width lists;
   - planning widgets in a responsive two-column row.
6. Every chart must have a visible text summary and an accessible data-table
   alternative. Privacy mode must hide chart values and summary figures.
7. Add empty states for no accounts, no transactions, no budgets, no bills, no
   piggy banks and missing summary keys.

### Phase 3 — Per-user appearance persistence

1. Add a frontend-only server store:
   - `FRONTEND_DATA_DIR` environment variable, default `.data` in development and
     `/app/data` in the container.
   - Owner key: `sha256(backendInternalApiUrl + "|" + user.id)`, never the email
     or PAT.
   - `appearance/<owner-key>/settings.json` and
     `appearance/<owner-key>/background.<ext>`.
   - Create directories with restrictive permissions; write settings atomically
     (temporary file + rename).
2. Add authenticated same-origin routes:
   - `GET /api/appearance`: return sanitized settings and background metadata URL.
   - `PUT /api/appearance`: validate and persist theme, frost, transparency and
     accent. Reject invalid/custom low-contrast colors.
   - `DELETE /api/appearance`: reset settings.
   - `POST /api/appearance/background`: accept `multipart/form-data`, validate
     MIME type (`image/jpeg`, `image/png`, `image/webp`), magic bytes and an upper
     size limit (8 MiB), strip filenames, store bytes.
   - `GET /api/appearance/background`: require session, stream the stored image
     with the correct content type and `X-Content-Type-Options: nosniff`.
   - `DELETE /api/appearance/background`: remove the image.
     All writes must require an authenticated session and a same-origin `Origin`
     check against `FRONTEND_PUBLIC_URL`. Reject SVG and arbitrary remote URLs.
3. Client-side `src/lib/appearance-store.ts`:
   - keep the existing localStorage cache for first paint;
   - hydrate from `/api/appearance` after login and apply the server value;
   - optimistic update on change, revert or show an error if the server write
     fails;
   - clear the local cache on disconnect, 401 or user change so the next user
     does not see the previous user’s appearance;
   - keep financial data out of localStorage/IndexedDB entirely.
4. Background upload UX:
   - client-side canvas compression to a reasonable maximum (for example
     2560×1600, JPEG/WebP quality ~0.85, target under 4 MiB);
   - preview, upload progress, success/error message and remove/reset action;
   - use the uploaded image through `--app-bg-image` with the existing tint/glass
     overlay so text contrast is preserved;
   - fall back to `/scenes/room-blur.jpg` (light) and `/scenes/room.jpg` (dark)
     when no custom image exists.
5. Appearance UI:
   - add a full “Appearance” section to `src/app/(app)/settings/page.tsx`;
   - keep a compact quick dialog in the shell that links to the full section;
   - controls: theme, accent preset swatches, custom hex input with contrast
     feedback, upload/remove background, frost slider, reduced transparency and
     reset all;
   - use labeled controls, keyboard support, live preview and an aria-live status
     message.
6. Deployment:
   - add a persistent data volume to `compose.example.yml`;
   - create `/app/data` with the `nextjs` ownership in the Dockerfile;
   - document `FRONTEND_DATA_DIR`, `SESSION_SECRET`, reverse-proxy asset routing
     and the shared-volume/single-replica requirement in `docs/DEPLOYMENT.md`.
   - If multi-replica is required later, document that the filesystem store must
     be replaced by shared storage; do not silently assume cross-replica sync.

### Phase 4 — Shared visual language and domain pages

Apply the same content pattern on every page:

`PageHeader` → filter/actions → summary tiles or progress → list/table/chart →
empty/error/help state. Avoid stacks of unrelated panels.

1. **Accounts**: summary tiles for assets/liabilities/net worth, filter toolbar,
   responsive account list, account detail summary and balance chart where the
   API supports it. Keep all existing create/edit/delete flows.
2. **Transactions**: compact filter bar, amount/type/account/category columns,
   responsive row layout, links to group/journal detail. Do not collapse split
   groups into a single invented total.
3. **Budgets**: progress bars with spent/limit, active/inactive state, available
   budgets and without-budget links. Keep create/edit/limit flows.
4. **Subscriptions**: grouped list with next expected date, amount range,
   frequency and status. Highlight due-soon entries from backend dates.
5. **Savings goals**: progress bars with current/target/percentage and target
   dates. Keep allocation forms.
6. **Categories, tags, object groups, link types, attachments**: consistent
   searchable lists, row actions and empty states. Keep existing CRUD and file
   upload behavior.
7. **Rules, recurrences, webhooks**: filter/list/detail polish, status/capability
   badges, honest disabled-feature states. Preserve all existing mutation and
   confirmation behavior.
8. **Insights and reports**: replace dropdown-only results with a chart plus
   breakdown table, range selector and accessible alternative. Keep the honest
   “report families unsupported” state for reports.
9. **Settings, preferences, currencies, exchange rates, administration, users,
   export, notifications, maintenance, help, security**: consistent headers and
   panels; appearance section as above; remove dead controls; keep native identity
   handoffs explicit and separate.
10. Remove fake marketing/demo copy that implies banking, cards, household
    sharing or payment execution. Keep English-only copy.

### Phase 5 — CSS/asset resilience

1. Add a production asset check to `scripts/smoke-production.mjs`:
   - fetch `/`;
   - extract stylesheet, script, font and scene URLs;
   - fetch every asset and assert a successful status and non-empty body;
   - fail if a referenced CSS/font/static chunk is missing.
2. Document reverse-proxy requirements in `docs/DEPLOYMENT.md`:
   - forward `/_next/`, `/fonts/`, `/scenes/`, `/api/` to the frontend;
   - do not cache authenticated HTML across deployments;
   - keep `FRONTEND_PUBLIC_URL`, `BACKEND_PUBLIC_URL` and
     `BACKEND_INTERNAL_API_URL` distinct;
   - verify `firefly.services.lan` serves the latest chunk names after deploy;
   - use `https://firefly-core.services.lan` for browser-native identity links
     and `http://ubuntu-host.lan:8081` only as a fallback public backend URL.
3. Avoid speculative asset-prefix changes. Only add `basePath`/`assetPrefix` if
   the deployment is actually served under a subpath.

## Suggested file ownership

- **Shared appearance/foundation owner**: `src/styles/tokens.css`,
  `src/app/globals.css`, `src/lib/appearance.ts`, `src/lib/appearance-store.ts`,
  new appearance server store/routes, `src/components/ui/primitives.*`,
  `src/components/shell/app-shell.tsx`, `src/lib/nav.ts`, `Dockerfile`,
  `compose.example.yml`, `.env.example`, `docs/DEPLOYMENT.md`.
- **Overview owner**: `src/app/(app)/page.tsx`,
  `src/features/overview/*`, `src/features/analysis/service.ts` (summary mapping),
  new shared chart components.
- **Domain owners**: one owner per page directory, with disjoint write sets.
- **Validation owner**: `tests/*`, `scripts/smoke-production.mjs`, fixtures.
- Serialize shared files and test config; do not run parallel edits on
  `tokens.css`, `globals.css`, `nav.ts`, `app-shell.tsx` or `package.json`.

## Data flow

```text
Browser
  -> same-origin Next pages and /api routes
  -> frontend Node server
  -> trusted BACKEND_INTERNAL_API_URL (Firefly 6.7.9 API)
  -> response mapped to decimal-string view models

Browser appearance controls
  -> PUT /api/appearance (same-origin, session-protected)
  -> frontend data directory (per-user JSON + background file)
  -> GET /api/appearance on next visit
  -> localStorage cache for first paint only
```

## Failure modes to handle

- One overview endpoint fails: show the other sections and a scoped error.
- Backend version mismatch: keep financial access blocked as today.
- Multiple currencies: group summary values by currency; never add unlike values.
- Missing summary key: show “Not reported”, not zero.
- Custom accent fails contrast: reject with a clear message and keep the previous
  accent.
- Background too large/invalid type: reject with a clear message; keep the
  existing background.
- Appearance server write fails: keep the local preview, show a persistent error,
  and retry only on explicit user action.
- Appearance file missing or corrupted: fall back to default scene/accent and
  repair the JSON on the next write.
- CSS chunk missing on deployment: surface the smoke-check failure rather than
  silently shipping an unstyled UI.
- User disconnects: clear local appearance cache; server appearance remains for
  the next authenticated visit.

## Acceptance criteria

- Logged-out `/` contains no fictional cards, balances, people, notices or
  forecasts. It shows a connect/setup path only.
- Logged-in `/` renders real summary/chart/account/transaction/budget/bill/piggy
  data from the existing 6.7.9 API, with exact date/currency scope.
- No fake “Cards”, “Safe to spend today”, “Statement”, “Send money”, invented
  household/people, or hardcoded transaction counts remain.
- Appearance supports theme, frost, reduced transparency, accessible accent
  presets, custom hex with contrast validation, background upload, remove/reset
  and per-user sync.
- The uploaded background survives reload and a new session for the same user,
  and is not visible to another user.
- All major pages use the shared header/list/table/graph/progress patterns and
  work at 320/390/760/768/1024/1180/1280/1440 px.
- Charts have text summaries and accessible data-table alternatives.
- Privacy mode hides every amount and chart value.
- CSS, font and scene assets resolve on the deployed frontend; the production
  smoke check catches missing assets.
- No backend files, image, database or sessions are modified.

## Verification

Run from the repository root:

```sh
npm run lint
npm run format:check
npm run typecheck
npm run test:unit
npm run test:browser
npm run build
npm run test:smoke:production
npm run validate:plans
```

Then run the existing official-image integration suite if the local disposable
fixture is available:

```sh
FIREFLY_IMAGE_INTEGRATION=1 node scripts/run-firefly-integration.mjs
```

Manual browser checks:

- `https://firefly.services.lan` with a real connection.
- `https://firefly-core.services.lan` for native identity links; fall back to
  `http://ubuntu-host.lan:8081` only if needed.
- Verify CSS/fonts/scenes in DevTools Network after a fresh deploy.
- Verify background upload, reload, disconnect/reconnect, another-user isolation,
  accent reset, contrast rejection, mobile layout and keyboard/a11y.
- Do not paste the `.dev_token` value into chat, logs, test names or committed
  files.

## Out of scope

- Any Firefly backend change, custom image, patch, plugin, database access or
  session bridge.
- New financial capabilities, bank payments, card issuance/freeze/CVV, household
  sharing, report-family parity or notification-delivery encryption.
- Cross-device financial data storage; only appearance metadata/image syncs.
- A new charting or image-processing dependency unless the existing stack cannot
  meet the acceptance criteria.

## Definition of done

The implementation handoff must record:

- changed files and the exact tests actually run;
- which overview sections use which API operations;
- appearance storage path/volume and cleanup behavior;
- visual/a11y evidence at the required widths and both themes;
- any residual unsupported states, especially reports and notifications;
- updated canonical `plans/` task cards and inventory evidence where applicable.
