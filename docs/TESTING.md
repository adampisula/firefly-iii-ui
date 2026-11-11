# Checks

Use the pinned Node/npm versions from `.nvmrc` and `package.json`.

```sh
npm ci
npm run check:version
npm run validate:plans
npm run lint
npm run format:check
npm run typecheck
npm run test:unit
npm run build
npm run test:smoke:production
npx playwright install chromium
npm run test:browser
```

`validate:plans` checks the inventory schema/IDs/owners/references, task dependencies, local Markdown links, pinned read-only source snapshot, and exact package/manifest contract. It warns when the exact-version API specification or official image/runtime provenance is not verified; a planning pass is not application or backend-runtime evidence. `test:unit` covers the package/compatibility version contract, planning validator failure cases, transport/finance helpers, deterministic fixture contracts, and FND-06 appearance/navigation/onboarding validation and mapping. `test:smoke:production` starts the built server temporarily and checks the page and health route. `test:browser` runs the local mock/browser suite; every spec uses a page fixture that blocks non-local requests, and the mock returns `501 unsupported_mock_operation` for unsupported paths and all writes. It covers the responsive shell (320px and 1280px), axe/contrast, appearance persistence, privacy masking, URL-backed date range, and honest planned/unknown routes. Playwright trace, screenshot, and video artifacts are disabled so failed tests cannot capture credentials or financial fixture data. CI sets `FIREFLY_TEST_MODE=mock` and `FIREFLY_IMAGE_INTEGRATION=0`; it has no live backend, notification, cron, purge, or production-data test job.

A separate image-test runner is guarded by `FIREFLY_IMAGE_INTEGRATION=1` and accepts only a local HTTP `/api/v1` URL, for example `FIREFLY_IMAGE_INTEGRATION=1 FIREFLY_TEST_BASE_URL=http://127.0.0.1:8089/api/v1 FIREFLY_TEST_PAT=<disposable local PAT> npm run test:integration:firefly`. It never starts an image or provisions credentials. `tests/integration/` verifies the official-image version/user contract, the FND-06 onboarding API composition and the FND-08-b contract probes (safe GET surfaces, webhook feature state, the `currencies.cer` defect, split-preserving updates and search pager links) against the isolated container, cleaning up the accounts and transactions it creates. Do not treat fixture results as runtime verification. Do not run destructive operations or tests against production data.

To exercise the full Next handler path against the isolated container, start the app with `FRONTEND_PUBLIC_URL=http://127.0.0.1:3200 BACKEND_PUBLIC_URL=http://127.0.0.1:8089 BACKEND_INTERNAL_API_URL=http://127.0.0.1:8089/api/v1 SESSION_SECRET=<local-only> npm run dev -- --hostname 127.0.0.1 --port 3200`, connect a disposable PAT through `POST /api/auth/session`, then use `GET/POST /api/onboarding`. Delete the disposable accounts afterwards. The Compose example is separately syntax-checked with `docker compose --env-file .env.example -f compose.example.yml config --quiet`.
