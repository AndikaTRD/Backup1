# ─── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

WORKDIR /app

# Copy entire workspace (node_modules / dist excluded via .dockerignore)
COPY . .

# Install all dependencies (including devDeps needed for build tools)
RUN pnpm install --frozen-lockfile

# Build the Vite frontend (output: artifacts/andika-store/dist/public)
# Vite sets NODE_ENV=production automatically during build
RUN pnpm --filter @workspace/andika-store run build

# Bundle the API server via esbuild (output: artifacts/api-server/dist)
RUN pnpm --filter @workspace/api-server run build

# ─── Stage 2: Runtime (lean image) ────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# The esbuild bundle is self-contained — only the compiled dist dirs are needed.
# The API server resolves the frontend path relative to /app so both must be here.
COPY --from=builder /app/artifacts/api-server/dist        ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/andika-store/dist/public ./artifacts/andika-store/dist/public

EXPOSE 8080
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
