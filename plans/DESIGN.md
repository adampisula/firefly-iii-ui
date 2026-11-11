# Design implementation contract

Owner: FND-03 (assets/tokens), FND-10 (primitives), FND-06 (shell), QA-02 (verification). **Accepted: Firefly name, Verdelo visual style, English-only UI.** Source assets remain read-only references at sibling `../design/` from frontend repo root. This document distinguishes visual requirements from the prototype's simulated business model; native backend identity screens are approved external handoffs, not redesign requirements.

## Authoritative references

- `firefly/design/design-system.html`: principles `:129–150`, colors `:154–230`, typography `:233–297`, spacing/radii `:300–331`, glass `:336–381`, motion `:385–418`, controls/forms/navigation/cards/feedback `:433–856`, accessibility `:858–885`.
- `firefly/design/css/app.css`: actual tokens `:9–204`, responsive rail/mobile rules `:2365–2555`, reduced motion `:2558–2565`, later glass overrides and reduced transparency `:2569+`. **Read the complete cascade** before extraction; early rules are not always final.
- `firefly/design/css/pages.css` and `design-system.css`: actual page patterns and catalogue presentation. Catalogue-only CSS is not necessarily application CSS.
- `firefly/design/assets/palette.json`: closed palette and derived-color rules. Note that category-series expressions differ slightly from app CSS; FND-03 must record a chosen source of truth, prefer live semantic tokens unless user says otherwise.
- `firefly/design/js/shell.js`: responsive shell, appearance settings, menus/search/quick-create; `ui.js`: drawer/popover/toast patterns. These are interaction references, **not production auth/focus/accounting libraries**.
- `firefly/design/index.html`: Urbanist currently requested from Google; theme/frost/rail initialization before paint.
- Supplied screenshots/drawings: supplementary visual references. Some images show a third-party template reference/buy banner and hues outside the final closed palette; some drawings have incomplete rendering. Prefer supplied live CSS/catalogue over assuming every screenshot pixel is authoritative. Do not reproduce buy banners or unrelated mock errors. FND-03 captures approved reproducible baselines.

## Visual rules to preserve

| Aspect | Contract |
| --- | --- |
| Palette | Only white `#ffffff`, fog `#f5f5f5`, ink `#000000`, slate `#8c8c8c`, line `#dbdbdb`, green `#137a50`, mint `#6ee0a1`; derive other shades via semantic `color-mix()` tokens. No default red/orange/blue UI palette. |
| Light/dark | Light accent green, dark accent mint, with appropriate on-accent ink. Support light/dark/system and no first-paint theme flash. |
| Surfaces | Room scene behind neutral translucent panes; low-alpha ground + backdrop blur + 1px rim + top sheen. More opaque reading/form panels. Solid primary action, not green page washes. |
| Typography | Urbanist 400/500/600/700 with system fallback; source sizes 11…36px, body ~14px/1.5. Tabular money digits, precise currency, no truncating monetary figures. No shrinking text to fit dense mobile tables. |
| Rhythm | 4px baseline; spacing 4/8/12/16/20/24/32/40; radii 6/8/10/12/18, pills for status/counts; frame max 1640px, desktop rail 248px. |
| Accent use | One primary action at a time, active navigation, measured data/progress signal. Don't let green and mint compete at the same hierarchy. |
| Motion | 160/260/380ms roles, supplied easing; short and explanatory. Reduced motion collapses transitions. No bouncing balances or animated fictional forecasts. |
| Appearance | Frost 0…1, default .5; rail collapse and theme persist locally as appearance only. Guarantee readability at both extremes. |

Self-host licensed fonts/scene assets; no runtime Google Fonts request by default. Record provenance and licensing: CSS comments mention recreation from a third-party demo, and source backend is AGPL. Do not assert redistribution is cleared simply because files were supplied. DEC-05/QA-06 must resolve this before publication.

## Layout and navigation adapted to Firefly

Proposed information architecture (FND-06 confirms labels/route manifest):

- **Overview**: real balances, cash flow, recent transactions, budgets/subscriptions/piggy progress.
- **Accounts**: assets, liabilities, expense/revenue counterparties, inactive; reconciliation entry on eligible asset detail.
- **Transactions**: withdrawals/deposits/transfers/all, search/filter, create/split, selection actions.
- **Planning**: budgets, subscriptions, piggy banks/goals.
- **Organize**: categories, tags, object groups, attachments.
- **Automation**: rules/groups, recurring templates, webhooks and delivery diagnostics.
- **Reports**: builder and report families, API insight views.
- **Settings**: preferences/appearance, currencies/rates, administration, trusted native-backend profile/security/token links, supported notifications, import/export, maintenance; owner section only for eligible users. Unsupported financial/notification controls explain capability limits rather than simulate success.
- **Help/System**: contextual help, version, sanitized diagnostics and explicit operational controls.

Desktop retains glass frame and collapsible sidebar; tablet follows compact ~76px rail at <=1180px; mobile <=760px uses sticky header, single column, bottom nav for frequent destinations plus **More** exposing every secondary screen. Treat these as source breakpoints, not device detection. All tasks must work at 320px as well as common desktop widths. Preserve access to search and all actions when the wide search field/side rail is hidden. Touch/keyboard are first class; no hover-only menus, chart values or row actions.

Drawers become bottom sheets on narrow screens; complex split/reconciliation/report editing may use a full page so focus/keyboard/footer are not trapped. Keep sticky actions above safe areas and virtual keyboards. Desktop dense tables get narrow-screen labeled row/detail patterns or a contained accessible scroller with column headers, never hidden required data. Don't make mobile users return to desktop for advanced functions.

## Prototype-to-Firefly semantic map

| Prototype | Firefly adaptation |
| --- | --- |
| Overview glass balance/flow panels | Actual `/summary/basic`, chart/insight data with visible date/currency scope; no invented forecast/payday analytics |
| Cards | Account cards/list, including credit-card account role; **not** issued card PAN/CVV, freeze, limits or bank controls |
| Payments / Send money | Transaction recording/transfer editor; make it explicit that Firefly does not execute bank payments |
| Bills | Subscriptions (same backend bill resource); distinct from generating recurring transactions |
| Goals / pots | Piggy banks with multi-account allocations and accurate reserved-fund semantics |
| Household | No household-sharing page on immutable 6.7.9; existing supported user/administration settings only |
| Notifications / noticed insights | Actual configured notifications or clearly derived factual data; no seeded people/notices and no invented inbox API |
| Settings / demo sign-in | Real appearance/preferences and secure PAT/native OAuth connect; native login/MFA/profile/security/token management stay on trusted backend public domain, never prototype credentials |

`design/js/data.js:1–12` explicitly uses simulated finances, in-memory/localStorage persistence and a fixed demo clock. Do not import it, `actions.js`, or the string-rendered shell into production. Demo Number rounding, simulated bank actions and `countUp()` values are not accounting semantics. Reimplement visual patterns with chosen framework and secure accessible controls; test focus rather than assuming a dialog role makes it accessible.

## Accessibility and responsive acceptance

Target WCAG 2.2 AA, not a claim that the prototype already meets it. Source minimum: body 4.5:1; large text/icons 3:1; visible 2px accent focus; 40px+ controls (prefer 44px for touch); signs/text/icons supplement color; zoom/reflow, names/labels and sensible reading order.

Verify on actual scene backgrounds, both themes and frost 0/.5/1. If glass cannot meet contrast, increase opacity/add opaque fallback **without changing the closed palette**. Test no-backdrop-filter, reduced transparency, reduced motion and forced-color/high-contrast environments. Do not rely solely on `prefers-reduced-transparency`, which may not be available in all browsers.

Reusable components must include: labeled fields/error summary, decimal/currency/date controls, async combobox, multi-select/tag input, pagination/filter toolbar, selectable semantic table/list, split rows, tabs/menu, dialog/drawer with trap/return focus and Escape behavior, tooltip, status/empty/error/loading, confirmation/progress, chart with equivalent data table, money/privacy display. Sliders/switches/segmented controls need keyboard and screen-reader states. Critical failures remain visible, not only disappearing toasts. Never offer Undo unless a tested backend reversal exists.

Visual test matrix: 320/390/760/768/1024/1180/1280/1440px widths (boundary tests include 759/760/761 and 1179/1180/1181 as appropriate), light/dark, long English text/names, large/negative/zero/zero-decimal/three-decimal amounts, huge identifiers and empty/error/loading states. Use representative golden screenshots for overview, transaction list/editor, budget, reconciliation, report and settings; don't maintain redundant screenshots for every trivial permutation.
