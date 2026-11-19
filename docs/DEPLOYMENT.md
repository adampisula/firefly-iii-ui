# Local deployment example

`compose.example.yml` is a repository-local example; it does not alter or replace a running stack. It starts the frontend, the original official Firefly III image and PostgreSQL. The example binds frontend/backend ports to loopback so a separately configured reverse proxy can serve them on **different public HTTPS domains**. Do not expose these HTTP ports directly to the internet.

## Configure

1. Copy `.env.example` to `.env` and replace every local-only value. Generate a unique Firefly `APP_KEY` with 32 random characters, a strong database password and a long random `SESSION_SECRET`. The assistant encrypts stored provider API keys with a key derived from `SESSION_SECRET`; changing it makes those keys unreadable. Never use the sample values outside a disposable local environment.
2. Set `FRONTEND_PUBLIC_URL` to the public frontend origin and `BACKEND_PUBLIC_URL` to the separately hosted native Firefly UI origin. `BACKEND_INTERNAL_API_URL` is the server-to-server URL on the Compose network and must not be sent to the browser. Keep all three concepts distinct.
3. `FIREFLY_IMAGE` defaults to the official `fireflyiii/core:version-6.7.9` release tag. Before deployment/certification, resolve the official tag for the target architecture and set `FIREFLY_IMAGE` to the verified immutable `fireflyiii/core@sha256:…` digest. The tag was confirmed on Docker Hub, but this repository has not verified an image digest or runtime `/api/v1/about` response. Do not substitute `latest` or infer image provenance from a source checkout.
4. Configure reverse-proxy TLS and forwarding for the two public domains. Register the exact frontend callback URL when OAuth support is implemented; never pass PATs, client secrets or credentials in callback URLs.
5. Review the official Firefly III 6.7.9 image documentation for current supported environment variables, configure backups and retention, then start the example with `docker compose --env-file .env -f compose.example.yml up --build`.

The frontend browser is intended to call same-origin Next.js handlers. Those handlers will use the trusted `BACKEND_INTERNAL_API_URL`; the browser uses `BACKEND_PUBLIC_URL` only for approved native Firefly identity pages. No backend cookie sharing or cross-domain credentialed CORS is assumed. User PATs belong in per-user server-side sessions, not Compose environment variables.

Appearance settings and custom background images are stored by the frontend, not by Firefly. The Compose example mounts the `frontend_appearance` volume at `/app/data` and sets `FRONTEND_DATA_DIR=/app/data`. The directory is keyed by a hash of the backend URL and user ID, with restrictive file permissions. Use one frontend replica, or replace the filesystem store with shared storage before scaling horizontally; a per-container volume would make appearance settings inconsistent across replicas. Financial data is never stored there.

The reverse proxy must forward `/_next/`, `/fonts/`, `/scenes/` and `/api/` to the frontend origin. Do not cache authenticated HTML across deployments: stale HTML can reference CSS or JavaScript chunk names that no longer exist after a deploy. The production smoke check fetches the deployed page and every referenced stylesheet, script, font and scene asset so a missing CSS file fails validation.

For local Compose syntax validation without starting services:

```sh
docker compose --env-file .env.example -f compose.example.yml config --quiet
```

This syntax check does not validate image provenance, secrets, proxy settings, backend compatibility or application data semantics. Never point the example at a production database or live deployment during development/tests.

## Optional AI assistant

The assistant is off by default. Enable it with `AI_ASSISTANT_ENABLED=true`; no provider URL, model, key or tuning values belong in Compose environment variables.

After enabling, open **Assistant → Assistant settings** as a connected user and enter:

- OpenRouter-compatible base URL (default `https://openrouter.ai/api/v1`)
- model ID (default `deepseek/deepseek-v4.1-flash-1017`)
- API key
- reasoning default, temperature, output-token limit and retention
- optional write-tools and risky-writes toggles

Provider settings are scoped to the Firefly user ID and stored in `FRONTEND_DATA_DIR/assistant.sqlite`. API keys are encrypted with a key derived from `SESSION_SECRET`; conversation text is plaintext in that SQLite file. Back up the volume. If `SESSION_SECRET` changes, users must re-enter their API keys.

Every mutating operation pauses the chat with an approval card. The model cannot approve its own writes. Piggy-bank create/add/remove tools preserve all account allocations and use exact decimal arithmetic.

The chat endpoint uses server-sent events and may remain open while a write approval is pending. Configure the reverse proxy not to buffer `/api/assistant/chat` (`X-Accel-Buffering: no`) and set its read timeout above the five-minute approval window. Do not expose a separate MCP service; the assistant executes tools inside the frontend process with the current session PAT.
