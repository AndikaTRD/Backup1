---
name: Railway deployment setup
description: How this monorepo is configured to deploy on Railway, and the gotchas found along the way.
---

## Setup

- **`Dockerfile`** (capital D) — multi-stage: builder installs deps + builds frontend (Vite) + builds API (esbuild), runner copies only the two `dist/` dirs and runs `node artifacts/api-server/dist/index.mjs`.
- **`railway.toml`** — health check path `/api/healthz`, restart on failure.
- **`.dockerignore`** — excludes `node_modules`, `**/dist`, `.local`, `.agents`, `attached_assets`.
- The empty lowercase `dockerfile` is left with a comment pointing to `Dockerfile`.

## Key decisions

**Trust proxy** — `app.set("trust proxy", 1)` must be set in `app.ts` before the session middleware. Railway terminates TLS at its proxy; without this, `req.secure` is always false and session cookies with `secure: true` are never sent.

**Secure cookies** — `cookie.secure = process.env.NODE_ENV === "production"`. Development (Replit) stays `http` so `false` is correct there.

**SESSION_SECRET fail-fast** — Added a production guard that throws if `SESSION_SECRET` is missing, so a misconfigured Railway deployment crashes loudly at startup instead of silently accepting forged sessions.

**Replit plugins are all dynamic imports** — `vite.config.ts` had a static `import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal"` which loaded the Replit package unconditionally during Railway builds. All three Replit plugins (`runtime-error-modal`, `cartographer`, `dev-banner`) are now inside a single `await import(...)` conditional guarded by `process.env.REPL_ID !== undefined && NODE_ENV !== "production"`.

**Why:**
- Static top-level imports load at config evaluation time, even when the plugin array conditional skips them.
- Dynamic imports inside the conditional guarantee the packages are never evaluated on Railway.

## Environment variables needed on Railway

| Variable | Source |
|---|---|
| `DATABASE_URL` | Set automatically by Railway's Supabase add-on |
| `SESSION_SECRET` | Set manually in Railway → Variables |
| `ADMIN_PASSWORD` | Set manually in Railway → Variables |
| `IMGBB_API_KEY` | Set manually in Railway → Variables |

`PORT` is injected automatically by Railway at runtime.

## How to apply

When deploying a new Railway service:
1. Connect the GitHub repo.
2. Railway auto-detects `Dockerfile` and uses it.
3. Add the four env vars above.
4. Health check at `/api/healthz` confirms the service is up.
