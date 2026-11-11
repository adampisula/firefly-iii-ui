# Firefly frontend

An English Next.js App Router frontend for the **unmodified official Firefly III 6.7.9 backend**, with Firefly branding and the Verdelo visual direction. The frontend and backend are served from separate public domains in one Compose deployment. Backend identity screens (login, registration, password reset, MFA, profile/security, PAT/OAuth client and cron-token management) remain native handoffs.

Supported now: search/autocomplete, accounts and liabilities, transaction reads/editor with splits, links, budgets, subscriptions, savings goals, categories/tags/object groups, attachments, rules, recurrences, webhooks (when enabled), chart/insight aggregates and settings. Reconciliation, repository report families, notification credentials, owner-only writes and bulk helper workflows remain explicitly documented residuals. This is a scoped release, not a full native-parity claim.

## Development

Use Node.js `26.13.0` and npm `12.2.2` (`.nvmrc` and `package.json`):

```sh
npm ci
npm run dev
```

Useful checks: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test:unit`, `npm run build`, `npm run test:browser`. See [docs/TESTING.md](docs/TESTING.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Container image publishing

`.github/workflows/docker-publish.yml` builds a multi-architecture image on every push to `main` and on manual dispatch, then publishes it to GitHub Container Registry:

```text
ghcr.io/<owner>/<repository>:latest
ghcr.io/<owner>/<repository>:sha-<short-sha>
ghcr.io/<owner>/<repository>:main
```

The workflow uses the repository `GITHUB_TOKEN`; no PAT or registry secret is required. Package visibility follows the repository/package settings in GitHub: public packages need no pull authentication, while private packages require `docker login ghcr.io` with a token that has `read:packages`. Platform images are `linux/amd64` and `linux/arm64`, with provenance and SBOM attestations.

## Deployment

Prerequisites: Docker with Compose v2, two public HTTPS origins (frontend and native backend), and a reverse proxy that terminates TLS.

### 1. Obtain the image

Run the publish workflow (push to `main` or dispatch it manually). Then either pull the published image:

```sh
docker pull ghcr.io/<owner>/<repository>:latest
```

or build the image locally:

```sh
docker build -t firefly-frontend:local .
```

Pin a specific `sha-…` tag for reproducible upgrades; `latest` moves.

### 2. Configure environment

Copy `.env.example` to `.env` and set real values:

```dotenv
FRONTEND_IMAGE=ghcr.io/<owner>/<repository>:latest
FRONTEND_PUBLIC_URL=https://app.example.com
BACKEND_PUBLIC_URL=https://firefly.example.com
BACKEND_INTERNAL_API_URL=http://firefly:8080/api/v1
FIREFLY_IMAGE=fireflyiii/core:version-6.7.9@sha256:d51ab6a3a7b91a5c892441578e0da7f2935f84f36bd1151fc3833acc6e060871
FIREFLY_APP_KEY=<32-random-characters>
POSTGRES_PASSWORD=<strong-database-password>
FIREFLY_SITE_OWNER=you@example.com
```

`BACKEND_INTERNAL_API_URL` is server-to-server only and must never be exposed to the browser. `FRONTEND_PUBLIC_URL` and `BACKEND_PUBLIC_URL` are the separate public origins. Use the verified official backend tag+digest shown in `backend-compatibility.json`; do not use `latest` or a custom backend image.

### 3. Start the stack

The repository Compose example uses a local build by default. To deploy the published image without building, set `FRONTEND_IMAGE` and run:

```sh
docker compose --env-file .env -f compose.example.yml pull frontend
docker compose --env-file .env -f compose.example.yml up -d --no-build
```

For local development with a source build:

```sh
docker compose --env-file .env -f compose.example.yml up -d --build
```

The example binds HTTP ports to loopback; expose only through the reverse proxy. Route the frontend domain to the frontend container port and the backend domain to Firefly. Do not share cookies across domains. Use host-only cookies and same-origin calls to the frontend's Next.js handlers.

### 4. First-run checks

1. Open the backend origin and complete native Firefly setup/login.
2. Create a personal access token or complete the documented native OAuth handoff.
3. Open the frontend, connect, and complete first-run account/currency setup.
4. Confirm `/api/health` on the frontend returns `ok` and the dashboard loads in the shell's date range.
5. Verify the runtime backend version is exactly `6.7.9`; financial access stays blocked on mismatch or unverifiable compatibility.

### 5. Upgrade and rollback

Upgrade by changing `FRONTEND_IMAGE` to a new immutable `sha-…` tag, then:

```sh
docker compose --env-file .env -f compose.example.yml pull frontend
docker compose --env-file .env -f compose.example.yml up -d --no-build
```

Rollback restores the previous image tag and restarts the frontend; no database migration belongs to the frontend. Keep the previous tag pinned until user acceptance.

### 6. Backups and identity boundaries

Back up the PostgreSQL database and Firefly upload volume with your operator tooling. The frontend never accesses the backend database, proxies backend sessions, stores PATs in browser storage or runs arbitrary installer commands. PAT/OAuth secrets belong only in server-side frontend session state or the native backend.

## Compatibility and project constraints

- The machine-readable exact backend/release contract is [backend-compatibility.json](backend-compatibility.json). Package version: `6.7.9-frontend.0.1.0`; release tag format: `v6.7.9-frontend.<major>.<minor>.<patch>`.
- Verified backend: official `fireflyiii/core:version-6.7.9`, digest `sha256:d51ab6a3a7b91a5c892441578e0da7f2935f84f36bd1151fc3833acc6e060871`, runtime `/api/v1/about` version `6.7.9`.
- Never modify Firefly III source, build a custom backend image, add backend endpoints/plugins, access its database from the frontend or bridge backend sessions. Do not commit PATs, OAuth secrets or other credentials.
- Preserve the canonical plans and task handoff in [plans/README.md](plans/README.md). Unsupported capabilities remain explicit; no full-parity claim is made while residual gaps remain.
