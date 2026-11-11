# Firefly frontend

An English Next.js App Router frontend for the **unmodified official Firefly III 6.7.9 backend**, using Firefly branding and the supplied Verdelo visual direction. The frontend and backend use separate public domains in one Compose deployment. Backend identity screens remain native; the frontend will connect using a per-user server-side session.

The scaffold is intentionally minimal. It does not yet provide account connection or financial workflows, and it does not claim full replacement parity.

## Development

Use Node.js `26.13.0` and npm `12.2.2` (`.nvmrc` and `package.json`):

```sh
npm ci
npm run dev
```

See [docs/TESTING.md](docs/TESTING.md) for lint, formatting, type, unit, build and browser smoke checks. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the repo-local Docker Compose example and separate-domain networking guidance.

## Compatibility and project constraints

- The machine-readable exact backend/release contract is [backend-compatibility.json](backend-compatibility.json). The planned package version is `6.7.9-frontend.0.1.0`; release tag format is `v6.7.9-frontend.<major>.<minor>.<patch>`.
- The official `fireflyiii/core:version-6.7.9` tag is listed on Docker Hub. Its immutable image digest and runtime `/api/v1/about` version remain unverified; production certification is blocked until both are recorded.
- Never modify Firefly III source, build a custom backend image, add backend endpoints/plugins, access its database from the frontend, or bridge backend sessions. Do not commit PATs, OAuth secrets or other credentials.
- Preserve the canonical plans and task handoff in [plans/README.md](plans/README.md). Unsupported backend capabilities remain explicit; no full-parity claim is made while residual gaps remain.
