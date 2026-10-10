import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();
let tableReady: Promise<unknown> | null = null;

function ensureTable() {
  if (!tableReady) {
    tableReady = db.execute(sql`CREATE TABLE IF NOT EXISTS customer_reviews (
      id BIGSERIAL PRIMARY KEY,
      customer_name VARCHAR(60) NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  }
  return tableReady;
}
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session.isAdmin) return next();
  res.status(401).json({ error: "Unauthorized" });
}
router.get("/reviews", async (_req, res) => {
  try {
    await ensureTable();
    const rows = await db.execute(sql`SELECT id, customer_name AS "customerName", rating, comment, created_at AS "createdAt" FROM customer_reviews WHERE status = 'published' ORDER BY created_at DESC LIMIT 50`);
    res.json(rows.rows ?? rows);
  } catch {
    res.status(500).json({ error: "Ulasan belum bisa dimuat." });
  }
});
router.post("/reviews", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const comment = typeof req.body?.comment === "string" ? req.body.comment.trim() : "";
  const rating = Number(req.body?.rating);
  if (name.length < 2 || name.length > 60 || comment.length < 8 || comment.length > 600 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Isi nama 2–60 karakter, komentar 8–600 karakter, dan rating 1–5 bintang." });
    return;
  }
  try {
    await ensureTable();
    await db.execute(sql`INSERT INTO customer_reviews (customer_name, rating, comment, status) VALUES (${name}, ${rating}, ${comment}, 'pending')`);
    res.status(201).json({ ok: true, message: "Terima kasih! Ulasan dikirim dan menunggu pemeriksaan admin." });
  } catch {
    res.status(500).json({ error: "Ulasan gagal disimpan. Coba lagi nanti." });
  }
});
router.get("/admin/reviews", requireAdmin, async (req, res) => {
  try {
    await ensureTable();
    const status = ["pending", "published", "rejected"].includes(String(req.query.status)) ? String(req.query.status) : "pending";
    const rows = await db.execute(sql`SELECT id, customer_name AS "customerName", rating, comment, status, created_at AS "createdAt" FROM customer_reviews WHERE status = ${status} ORDER BY created_at DESC LIMIT 200`);
    res.json(rows.rows ?? rows);
  } catch {
    res.status(500).json({ error: "Ulasan gagal dimuat." });
  }
});
router.patch("/admin/reviews/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const status = req.body?.status;
  if (!Number.isSafeInteger(id) || id < 1 || !["published", "rejected"].includes(status)) {
    res.status(400).json({ error: "Permintaan tidak valid." });
    return;
  }
  try {
    await ensureTable();
    const result = await db.execute(sql`UPDATE customer_reviews SET status = ${status} WHERE id = ${id} RETURNING id`);
    if (!(result.rows ?? result).length) { res.status(404).json({ error: "Ulasan tidak ditemukan." }); return; }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Status ulasan gagal diperbarui." });
  }
});
router.delete("/admin/reviews/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ error: "ID tidak valid." }); return; }
  try {
    await ensureTable();
    await db.execute(sql`DELETE FROM customer_reviews WHERE id = ${id}`);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Ulasan gagal dihapus." });
  }
});
export default router;
