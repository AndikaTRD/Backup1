# Railway Deployment Health Check Fixes

## Summary
Fixed the Railway health check failures that were preventing deployment of the Backup1 project on Alpine Linux. The issue had multiple root causes that required fixes across the entire deployment pipeline.

## Root Causes Identified and Fixed

### 1. **Missing Alpine Linux Native Binaries (Critical)**
**Problem:** The project uses build tools with platform-specific native binaries:
- `@rollup/rollup-linux-x64-musl` (used by Vite)
- `lightningcss-linux-x64-musl` (CSS processor)
- `@tailwindcss/oxide-linux-x64-musl` (Tailwind compiler)

These are optional dependencies that should only be installed on Alpine Linux (musl libc), but incorrect pnpm overrides were **suppressing** them entirely.

**Fix:**
- Updated `pnpm-workspace.yaml` to remove three blocking override lines:
  - Line 106: `lightningcss>lightningcss-linux-x64-musl: "-"`
  - Line 123: `@tailwindcss/oxide>@tailwindcss/oxide-linux-x64-musl: "-"`
  - Line 141: `rollup>@rollup/rollup-linux-x64-musl: "-"`
- Removed direct platform binary dependencies from root `package.json`
- These packages are now correctly installed as optional dependencies through their parent packages

### 2. **Server Not Binding to All Interfaces (Critical)**
**Problem:** The Express server was calling `app.listen(port)` without specifying a host parameter, which defaults to localhost (127.0.0.1). Railway's health check probe cannot reach a server bound to localhost.

**Fix:**
- Changed `app.listen(port)` to `app.listen(port, "0.0.0.0")` in `artifacts/api-server/src/index.ts`
- Server now binds to all network interfaces on the container

### 3. **Missing PORT Environment Variable**
**Problem:** The server requires `process.env.PORT` but Railway may not always pass it explicitly during startup.

**Fix:**
- Added `ENV PORT=8080` to the Dockerfile runtime stage (line 28)
- This ensures PORT is always defined with a sensible default
- Railway can override this if needed

### 4. **Insufficient Health Check Timeout**
**Problem:** Railway's default 60-second health check timeout is too short for cold Alpine Linux containers loading large build artifacts and dependencies.

**Fix:**
- Increased `healthcheckTimeout` from 60 to 90 seconds in `railway.toml`
- Added `startTimeout = 120` for aggressive startup monitoring
- This allows the server enough time to fully initialize

### 5. **No Server Startup Logging**
**Problem:** Railway deployment logs showed no indication whether the server started, which port it's on, or what went wrong.

**Fix:**
- Added comprehensive startup logging in `artifacts/api-server/src/index.ts`:
  - Logs port and environment when starting
  - Logs successful binding with timestamp when listening on 0.0.0.0
  - Catches and logs `server.on('error')` events
  - Logs all SIGTERM/SIGINT graceful shutdown events
  - Logs uncaught exceptions and unhandled rejections
- Added error handling and logging to health check endpoint
- Railway logs now clearly show server status

### 6. **Missing Global Error Handler**
**Problem:** Unhandled errors in Express could cause the server to become unresponsive without logging.

**Fix:**
- Added global error handler middleware in `artifacts/api-server/src/app.ts`
- All unhandled errors are now logged and return 500 JSON response

## Files Changed

1. **pnpm-workspace.yaml**
   - Removed 3 incorrect override lines suppressing musl binaries
   - Simplified platform-specific package filtering

2. **package.json** (root)
   - Removed incorrect direct platform binary dependencies
   - Platform binaries now managed as optional dependencies through parent packages

3. **Dockerfile**
   - Added `ENV PORT=8080` to runtime stage
   - Ensures port is always defined

4. **railway.toml**
   - Increased health check timeout from 60s to 90s
   - Added 120s startup timeout
   - Better suited for Alpine cold starts

5. **artifacts/api-server/src/index.ts**
   - Changed `app.listen(port)` to `app.listen(port, "0.0.0.0")`
   - Added comprehensive startup logging
   - Added graceful shutdown handlers (SIGTERM/SIGINT)
   - Added error event handlers
   - Added uncaught exception and unhandled rejection handlers

6. **artifacts/api-server/src/routes/health.ts**
   - Added try-catch around health endpoint
   - Explicit `res.status(200)` for successful checks
   - Health check failures are logged

7. **artifacts/api-server/src/app.ts**
   - Added global error handler middleware
   - Prevents silent crashes from unhandled errors

## Deployment Verification Steps

1. **Build succeeds locally:**
   ```bash
   pnpm install --frozen-lockfile
   pnpm --filter @workspace/andika-store run build
   pnpm --filter @workspace/api-server run build
   ```

2. **Docker image builds successfully:**
   ```bash
   docker build -t backup1:latest .
   ```

3. **Container starts and logs show server listening:**
   ```bash
   docker run -e PORT=8080 backup1:latest
   # Should see: "✓ Server successfully started and listening on all interfaces"
   ```

4. **Health check endpoint responds:**
   ```bash
   curl -s http://localhost:8080/api/healthz | jq
   # Should return: {"status": "ok"}
   ```

## Why This Fixes Railway Deployment

1. **Build artifacts now available:** Alpine Linux can now load the required musl-compiled native binaries
2. **Server accepts external connections:** Binding to 0.0.0.0 allows Railway's health check probe to reach it
3. **Environment variables properly set:** PORT is guaranteed to exist
4. **Adequate startup time:** 90-120 second timeouts allow for cold container startup
5. **Visibility into issues:** Comprehensive logging shows exactly what's happening during startup
6. **Graceful error handling:** Crashes are caught and logged instead of silently failing

## Common Railway Deployment Patterns

This configuration now follows Railway best practices:
- Server binds to 0.0.0.0 to accept external connections
- PORT environment variable is used (Railway sets this automatically)
- Health check endpoint returns simple JSON with HTTP 200
- Graceful shutdown handlers for SIGTERM (Railway signals on shutdown)
- Comprehensive logging for debugging deployment issues
- Docker image built with Alpine Linux for minimal size

## Next Steps if Issues Persist

If health checks still fail after these fixes:

1. **Check Railway deployment logs** for startup messages confirming "✓ Server successfully started"
2. **Verify health check endpoint:** Railway dashboard should show health check results
3. **Check PORT variable:** Ensure Railway hasn't set a different PORT than 8080
4. **Monitor CPU/memory:** Alpine containers may need resource limits adjusted
5. **Test locally first:** Use Docker to simulate Railway environment

```bash
# Simulate Railway environment locally
docker run -e NODE_ENV=production -e PORT=8080 -p 8080:8080 backup1:latest
curl http://localhost:8080/api/healthz
```
