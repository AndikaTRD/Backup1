import { Router } from "express";
import {
  absensiEntriesTable,
  absensiPersonnelTable,
  absensiStoresTable,
  db,
} from "@workspace/db";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { hasConfirmedAbsensiPurchase, requireCustomer } from "./customer-auth";

const router = Router();
const STATUSES = new Set(["hadir", "libur", "izin", "sakit", "alpha"]);
const SHIFTS = new Set(["pagi", "siang", "malam", "libur"]);

function getUserId(req: Parameters<typeof requireCustomer>[0]) {
  return req.session.customerUserId!;
}

function getMonthRange(rawMonth: unknown) {
  const month =
    typeof rawMonth === "string" && /^\d{4}-\d{2}$/.test(rawMonth)
      ? rawMonth
      : new Date().toISOString().slice(0, 7);
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) return null;

  const start = `${month}-01`;
  const endDate = new Date(Date.UTC(year, monthNumber, 1));
  const end = endDate.toISOString().slice(0, 10);
  return { month, start, end };
}

async function getOwnedStore(userId: number, create = false) {
  let [store] = await db
    .select()
    .from(absensiStoresTable)
    .where(eq(absensiStoresTable.ownerUserId, userId));

  if (!store && create) {
    [store] = await db
      .insert(absensiStoresTable)
      .values({ ownerUserId: userId, storeName: "Toko Saya" })
      .returning();
  }

  return store;
}

async function getEntitledStore(req: Parameters<typeof requireCustomer>[0], res: Parameters<typeof requireCustomer>[1]) {
  const userId = getUserId(req);
  if (!(await hasConfirmedAbsensiPurchase(userId))) {
    res.status(403).json({ error: "Produk ABSENSI TOKO belum aktif.", code: "ABSENSI_NOT_ACTIVE" });
    return null;
  }
  return getOwnedStore(userId, true);
}

router.get("/absensi/store", requireCustomer, async (req, res): Promise<void> => {
  const store = await getEntitledStore(req, res);
  if (!store) return;

  const range = getMonthRange(req.query.month);
  if (!range) {
    res.status(400).json({ error: "Format bulan harus YYYY-MM." });
    return;
  }

  const [personnel, entries] = await Promise.all([
    db
      .select()
      .from(absensiPersonnelTable)
      .where(eq(absensiPersonnelTable.storeId, store.id))
      .orderBy(asc(absensiPersonnelTable.sortOrder), asc(absensiPersonnelTable.id)),
    db
      .select()
      .from(absensiEntriesTable)
      .where(
        and(
          eq(absensiEntriesTable.storeId, store.id),
          gte(absensiEntriesTable.attendanceDate, range.start),
          lt(absensiEntriesTable.attendanceDate, range.end),
        ),
      ),
  ]);

  res.json({ store, personnel, entries, month: range.month });
});

router.patch("/absensi/store", requireCustomer, async (req, res): Promise<void> => {
  const store = await getEntitledStore(req, res);
  if (!store) return;
  const storeName = typeof req.body?.storeName === "string" ? req.body.storeName.trim() : "";
  if (!storeName || storeName.length > 120) {
    res.status(400).json({ error: "Nama toko wajib diisi dan maksimal 120 karakter." });
    return;
  }

  const [updated] = await db
    .update(absensiStoresTable)
    .set({ storeName })
    .where(and(eq(absensiStoresTable.id, store.id), eq(absensiStoresTable.ownerUserId, getUserId(req))))
    .returning();
  res.json({ store: updated });
});

router.post("/absensi/personnel", requireCustomer, async (req, res): Promise<void> => {
  const store = await getEntitledStore(req, res);
  if (!store) return;
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const role = typeof req.body?.role === "string" ? req.body.role.trim() : "Crew";
  if (!name || name.length > 100 || !role || role.length > 80) {
    res.status(400).json({ error: "Nama personil dan jabatan wajib diisi." });
    return;
  }

  const [personnel] = await db
    .insert(absensiPersonnelTable)
    .values({ storeId: store.id, name, role })
    .returning();
  res.status(201).json({ personnel });
});

router.patch("/absensi/personnel/:personnelId", requireCustomer, async (req, res): Promise<void> => {
  const store = await getEntitledStore(req, res);
  if (!store) return;
  const personnelId = Number(req.params.personnelId);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const role = typeof req.body?.role === "string" ? req.body.role.trim() : "";
  if (!Number.isInteger(personnelId) || !name || !role) {
    res.status(400).json({ error: "Data personil tidak valid." });
    return;
  }

  const [updated] = await db
    .update(absensiPersonnelTable)
    .set({ name, role })
    .where(and(eq(absensiPersonnelTable.id, personnelId), eq(absensiPersonnelTable.storeId, store.id)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Personil tidak ditemukan." });
    return;
  }
  res.json({ personnel: updated });
});

router.delete("/absensi/personnel/:personnelId", requireCustomer, async (req, res): Promise<void> => {
  const store = await getEntitledStore(req, res);
  if (!store) return;
  const personnelId = Number(req.params.personnelId);
  if (!Number.isInteger(personnelId)) {
    res.status(400).json({ error: "Personil tidak valid." });
    return;
  }

  const [deleted] = await db
    .delete(absensiPersonnelTable)
    .where(and(eq(absensiPersonnelTable.id, personnelId), eq(absensiPersonnelTable.storeId, store.id)))
    .returning({ id: absensiPersonnelTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Personil tidak ditemukan." });
    return;
  }
  res.json({ ok: true });
});

router.put("/absensi/attendance", requireCustomer, async (req, res): Promise<void> => {
  const store = await getEntitledStore(req, res);
  if (!store) return;
  const personnelId = Number(req.body?.personnelId);
  const attendanceDate = typeof req.body?.attendanceDate === "string" ? req.body.attendanceDate : "";
  const status = typeof req.body?.status === "string" ? req.body.status.toLowerCase() : "";
  const shift = typeof req.body?.shift === "string" ? req.body.shift.toLowerCase() : "";

  if (
    !Number.isInteger(personnelId) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate) ||
    !STATUSES.has(status) ||
    !SHIFTS.has(shift)
  ) {
    res.status(400).json({ error: "Data absensi tidak valid." });
    return;
  }

  const [personnel] = await db
    .select({ id: absensiPersonnelTable.id })
    .from(absensiPersonnelTable)
    .where(and(eq(absensiPersonnelTable.id, personnelId), eq(absensiPersonnelTable.storeId, store.id)));
  if (!personnel) {
    res.status(404).json({ error: "Personil tidak ditemukan." });
    return;
  }

  const [entry] = await db
    .insert(absensiEntriesTable)
    .values({ storeId: store.id, personnelId, attendanceDate, status, shift })
    .onConflictDoUpdate({
      target: [absensiEntriesTable.personnelId, absensiEntriesTable.attendanceDate],
      set: { status, shift },
    })
    .returning();
  res.json({ entry });
});

export default router;