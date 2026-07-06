# Andika Store

Toko online dengan Admin Panel untuk mengelola order, konfirmasi pembayaran, dan melihat statistik revenue.

## Run & Operate

- **Frontend**: `PORT=24216 pnpm --filter @workspace/andika-store run dev` — Vite dev server (port 24216)
- **API Server**: `PORT=8080 pnpm --filter @workspace/api-server run dev` — Express API (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema to Supabase (requires SUPABASE_DATABASE_URL secret)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec

## Required Secrets

| Secret | Keterangan |
|---|---|
| `SUPABASE_DATABASE_URL` | Connection string Supabase (Settings → Database → URI). Digunakan di Replit. |
| `SESSION_SECRET` | Secret untuk express-session (sudah diset). |
| `ADMIN_PASSWORD` | Password login Admin Panel di `/admin`. |
| `IMGBB_API_KEY` | API key imgbb.com untuk upload bukti pembayaran. |

> Di Railway, gunakan `DATABASE_URL` (diisi otomatis oleh Railway dari Supabase add-on).

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui
- API: Express 5
- DB: PostgreSQL (Supabase) + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/andika-store/src/pages/` — halaman (Home, Admin, Cart, Checkout, Order)
- `artifacts/andika-store/src/components/` — komponen UI
- `artifacts/api-server/src/routes/` — API routes (admin.ts, orders.ts, products.ts)
- `lib/db/src/schema/` — Drizzle schema (orders, products)
- `lib/api-zod/src/generated/` — generated Zod schemas + TypeScript types
- `lib/api-spec/src/` — OpenAPI spec (source of truth for API contract)

## Architecture decisions

- **Supabase SSL**: `lib/db/src/index.ts` auto-detects Supabase URLs and enables `ssl: { rejectUnauthorized: false }`.
- **Dual env var**: Code checks `SUPABASE_DATABASE_URL` first, then falls back to `DATABASE_URL`. Replit uses the former; Railway uses the latter.
- **Admin Panel**: Session-based auth (`/api/admin/login`). Sessions stored in memory — restarting the server clears admin sessions.
- **Image upload**: Bukti pembayaran di-upload ke ImgBB, URL disimpan di kolom `payment_proof_url`.
- **Auto-clean**: Order yang lebih dari 30 hari dihapus detail-nya (items, notes, proof URL) — dijalankan max sekali per 24 jam dari Admin Panel.

## Gotchas

- Setelah mengubah schema DB, jalankan `pnpm --filter @workspace/db run push` untuk sync ke Supabase.
- Setelah mengubah OpenAPI spec, jalankan `pnpm --filter @workspace/api-spec run codegen` untuk regenerate types.
- Admin Panel (`/admin`) memanggil API di `https://www.andikastore.online` (hardcoded). Untuk dev lokal, ubah konstanta `API` di `artifacts/andika-store/src/pages/Admin.tsx`.

## User preferences

- Jangan mengubah struktur project, Dockerfile, package.json, Vite config, konfigurasi Railway, atau environment variables.
- Jangan mengubah halaman selain Admin Panel kecuali diminta.
- Project harus tetap bisa di-deploy ke Railway tanpa konfigurasi tambahan.
