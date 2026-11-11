# QA-05 — Performance, resilience and deployment evidence

Date: 2026-11-11. Environment: Node `26.13.0`, npm `12.2.2`, headless Chromium.

- Production build passes. Static client bundle: **39 files / 827,244 bytes (~808 KiB), 892 KiB on disk**; largest chunk 228,093 bytes. No unbounded client data fetch or first-page-only aggregate was found in implemented screens.
- Production smoke (`npm run test:smoke:production`) passes `/` and `/api/health`.
- Reference budgets: p75 LCP ≤2.5s, INP ≤200ms, CLS ≤0.1.
- `node scripts/measure-performance.mjs` on the production build (local Chromium, 1280×900) measured LCP **80ms /, 32ms /search, 32ms /accounts, 28ms /budgets** and CLS **0** on all four routes. Measurements are local/reference-only and not field data.
- INP was not instrumented; local Playwright interactions complete in well under the budget, but an INP field/lab number is **not claimed**.
- Pagination, search limits, autocomplete limits (≤50), export streaming via BFF and explicit error/timeout states are implemented. No offline write queue or fabricated success exists.
- Deployment: separate public frontend/backend domains; three URLs (`FRONTEND_PUBLIC_URL`, `BACKEND_PUBLIC_URL`, server-only `BACKEND_INTERNAL_API_URL`); host-only cookies; fixed internal upstream. Compose example validates with `docker compose --env-file .env.example -f compose.example.yml config --quiet`.
- Backend pin: `fireflyiii/core:version-6.7.9`, digest `sha256:d51ab6a3a7b91a5c892441578e0da7f2935f84f36bd1151fc3833acc6e060871`; `/about` runtime version 6.7.9. No custom image.
- Mismatch/restart behavior relies on server runtime verification; integration tests confirm invalid PAT 401 and exact-version probe. A live upgrade/downgrade cycle was not run.

## Disclosed limits

- No load/large-seed benchmark, multi-replica session-store test or reverse-proxy upload stress test was run; Docker Compose production network was syntax-validated only.
- Rollback was not exercised against a running deployment.
