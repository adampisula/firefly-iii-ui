# Local deployment example

`compose.example.yml` is a repository-local example; it does not alter or replace a running stack. It starts the frontend, the original official Firefly III image and PostgreSQL. The example binds frontend/backend ports to loopback so a separately configured reverse proxy can serve them on **different public HTTPS domains**. Do not expose these HTTP ports directly to the internet.

## Configure

1. Copy `.env.example` to `.env` and replace every local-only value. Generate a unique Firefly `APP_KEY` with 32 random characters and a strong database password. Never use the sample values outside a disposable local environment.
2. Set `FRONTEND_PUBLIC_URL` to the public frontend origin and `BACKEND_PUBLIC_URL` to the separately hosted native Firefly UI origin. `BACKEND_INTERNAL_API_URL` is the server-to-server URL on the Compose network and must not be sent to the browser. Keep all three concepts distinct.
3. `FIREFLY_IMAGE` defaults to the official `fireflyiii/core:version-6.7.9` release tag. Before deployment/certification, resolve the official tag for the target architecture and set `FIREFLY_IMAGE` to the verified immutable `fireflyiii/core@sha256:…` digest. The tag was confirmed on Docker Hub, but this repository has not verified an image digest or runtime `/api/v1/about` response. Do not substitute `latest` or infer image provenance from a source checkout.
4. Configure reverse-proxy TLS and forwarding for the two public domains. Register the exact frontend callback URL when OAuth support is implemented; never pass PATs, client secrets or credentials in callback URLs.
5. Review the official Firefly III 6.7.9 image documentation for current supported environment variables, configure backups and retention, then start the example with `docker compose --env-file .env -f compose.example.yml up --build`.

The frontend browser is intended to call same-origin Next.js handlers. Those handlers will use the trusted `BACKEND_INTERNAL_API_URL`; the browser uses `BACKEND_PUBLIC_URL` only for approved native Firefly identity pages. No backend cookie sharing or cross-domain credentialed CORS is assumed. User PATs belong in per-user server-side sessions, not Compose environment variables.

For local Compose syntax validation without starting services:

```sh
docker compose --env-file .env.example -f compose.example.yml config --quiet
```

This syntax check does not validate image provenance, secrets, proxy settings, backend compatibility or application data semantics. Never point the example at a production database or live deployment during development/tests.
