# Design extraction and asset audit (FND-03)

Updated 2026-11-11. This is a source audit and token extraction for the English Firefly frontend, not a license grant, accessibility certification, or adoption of Verdelo's simulated household/card/banking product.

## Source review and token decisions

| Source | Observation and use |
| --- | --- |
| `../design/css/app.css:9–204` | Live light/dark palette and semantic tokens. The seven registered literals and color-mix derivation are the source for `src/styles/tokens.css`. |
| `../design/css/app.css:2365–2555` | App breakpoints: compact rail at 1180px and mobile shell at 760px. The token layer records both rail widths; FND-06 adapts the actual Firefly shell/navigation. |
| `../design/css/app.css:2558–2815` | Reduced-motion rule and final glass overrides. The final cascade confirms pane sheen/rim/shadows, real blur, solid accent controls, and reduced-transparency opaque fallbacks. These late rules take precedence over earlier surface declarations. |
| `../design/css/pages.css` | Application page patterns only; it has a page-specific dark piggy icon override at line 2056 but no competing root token system. Patterns are visual references, not business semantics. |
| `../design/css/design-system.css:1–8` | `--ds-*` values are catalogue-shell layout tokens only; the catalogue builds on `app.css` and does not replace app tokens. |
| `../design/assets/palette.json` | Seven-color palette and derived color rule. Its `categorySeries[4]` expression (`green 88% + mint`) differs from live `app.css` `--c5` (`green 30% + black`). This implementation follows the live app semantic series; the mismatch is retained here rather than silently combining the two. Revisit chart colors with the chart/data-table work. |
| `../design/design-system.html:129–418, 858–885` | Quiet neutral grounds, one accent, Urbanist hierarchy, 4px spacing baseline, 6–18px radii, glass recipe, motion and accessibility floors. |
| `../design/design-system.html:433–856` | Controls and patterns inform later accessible components; prototype actions and fake banking/card states are not production behaviors. |

`app.css` comments identify a component/behavior recreation of the third-party `demo.codeandchill.store/verdelo` reference. Firefly adapts only the visual language; it does not reproduce the demo's household concept, fictional payment/card controls, demo data, demo actions or shell implementation. Source screenshots are reference material, not pixel-perfect acceptance baselines for an as-yet-unbuilt feature UI.

## Extracted token contract

`src/styles/tokens.css` contains:

- The closed palette: white `#ffffff`, fog `#f5f5f5`, ink `#000000`, slate `#8c8c8c`, line `#dbdbdb`, green `#137a50`, mint `#6ee0a1`. Other tones are derived with `color-mix()` from these values.
- The source type sizes (11–36px), Urbanist-first stack, weights 400/500/600/700 and tabular-money-ready defaults for later financial components; spacing 4/8/12/16/20/24/32/40px; radii 6/8/10/12/18px; 160/260/380ms motion roles and supplied easing.
- Light/dark semantic ink, accent, status, surface and glass variables. Light uses green as the accent; dark uses mint with dark on-accent text. System dark mode is supported when no explicit theme attribute is set.
- Frost default `0.5`, blur, sheen, rim and opaque surfaces. `prefers-reduced-transparency` disables blur and switches to opaque surfaces; reduced motion collapses transitions/animations.

Urbanist is named as the first family in CSS but is not bundled. The prototype requests it from Google Fonts; no local font file or license/provenance record was present in the supplied assets. This frontend makes no runtime font request and falls back to system UI fonts until font rights and self-hosting are cleared. No `room.jpg`, `room-blur.jpg`, screenshot, drawing or icon asset was copied into the app: the supplied material has no accompanying license/rights record, and source CSS itself references a third-party demo recreation. DEC-05/QA-06 publication review must resolve ownership and redistribution permission before any such asset is shipped. No clearance is inferred from inclusion in the workspace.

The supplied `room.jpg` and `room-blur.jpg` are JPEG scene files; `assets/palette.json` is a palette document. No font binaries or asset license file were found in `../design/assets`. `index.html` and `design-system.html` both include Google Fonts preconnect/stylesheet links; production frontend assets do not.

## Responsive reference baselines and Firefly wireframes

The sibling design folder includes these supplied screenshot references: `Screenshot_2026-11-11_13-54-17.png`, `Screenshot_2026-11-11_13-54-17-1.png`, `Screenshot_2026-11-11_13-54-21.png`, `Screenshot_2026-11-11_13-54-21-1.png`, `Screenshot_2026-11-11_13-54-27.png`, `Screenshot_2026-11-11_13-54-27-1.png`, `Screenshot_2026-11-11_13-54-31.png`, `Screenshot_2026-11-11_13-54-31-1.png`, `Screenshot_2026-11-11_13-54-43.png`, `Screenshot_2026-11-11_13-54-43-1.png`, `Screenshot_2026-11-11_13-54-47.png`, `Screenshot_2026-11-11_13-54-47-1.png`, `Screenshot_2026-11-11_13-54-51.png`, `Screenshot_2026-11-11_13-54-51-1.png`, `Screenshot_2026-11-11_13-54-55.png`, `Screenshot_2026-11-11_13-54-55-1.png`, and `Screenshot_2026-11-11_13-54-55-2.png`; supplied drawings are `drawing-2026-11-11T14-08-04-395Z.png` and `drawing-2026-11-11T14-08-28-532Z.png`. Retain these as source references only; they contain Verdelo prototype content, and no mapping to exact production screens or rights grant is recorded. QA-02 should create Firefly-specific screenshot goldens after the relevant screens exist.

Use the accepted responsive boundaries in `DESIGN.md`: verify 320/390/760/768/1024/1180/1280/1440px and 759/760/761 plus 1179/1180/1181 boundary cases. At narrow widths, provide labeled row/detail layouts or an accessible contained table scroller; drawers become bottom sheets, while complex editing can occupy a full page. Keep required actions, search and secondary destinations reachable without hover or a desktop-only return path.

Firefly-specific missing-screen wireframes (structure only; backend capability remains authoritative):

- **Split transaction editor:** full-page mobile editor; one row per journal/split with amount, currency and account/category/payee fields; retain every existing journal ID on PUT. Show transaction-group and journal identities distinctly; never sum unlike currencies. No assumption that the API supports unverified split side effects.
- **Reconciliation:** enter from an eligible asset-account detail; show statement date/balance and a separate difference summary. Do not promise the legacy UI's special balance-posting behavior: classify through FND-08 and expose unsupported/read-only state until the immutable API contract is proven.
- **Reports:** report family and date/account filters above a chart with an equivalent accessible data table; show currency/date scope, permissions, empty and unsupported states. No fictional forecast or household totals.
- **Settings/administration:** separate frontend appearance/preferences from links to trusted native Firefly identity/security screens. Hide or explain controls by verified capability/permission; do not simulate owner invitation, notification or system operations absent API support.

These are interaction/layout baselines, not permission to implement unsupported operations or alter the immutable backend.

## Checks and remaining review

Completed in this task: token literal/fallback unit checks, formatting/type/lint/build checks, a scan of generated browser assets for external font requests, and a browser contrast check for the status surface against the plain page ground in both themes at frost 0/0.5/1 (all at least 4.5:1). No scene asset was loaded because its rights remain unverified; scene-background contrast/device certification has not been performed, and no design asset was redistributed. Remaining: compare real Firefly feature screenshots at the stated widths/themes/frost settings, WCAG 2.2 AA contrast/focus testing including scene backgrounds if licensed, and legal publication review for the third-party demo-derived CSS, font, icons and scene imagery.
