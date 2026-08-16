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
const STATUSES = new Set(["P", "S", "M", "O", "SO", "AO", "CUTI", "IZIN"]);
const ROLE_RANK: Record<string, number> = { COS: 0, ACOS: 1, Crew: 2 };

function normalizeRole(rawRole: unknown) {
  if (typeof rawRole !== "string") return null;
  const role = rawRole.trim().toLowerCase();
  return role === "cos" ? "COS" : role === "acos" ? "ACOS" : role === "crew" ? "Crew" : null;
}

function sortPersonnel<T extends { role: string; name: string; id: number }>(personnel: T[]) {
  return [...personnel].sort(
    (a, b) =>
      (ROLE_RANK[a.role] ?? 99) - (ROLE_RANK[b.role] ?? 99) ||
      a.name.localeCompare(b.name, "id") ||
      a.id - b.id,
  );
}

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
      .values({ ownerUserId: userId, storeName: "" })
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

  const [rawPersonnel, entries] = await Promise.all([
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

  res.json({ store, personnel: sortPersonnel(rawPersonnel), entries, month: range.month });
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
  const role = normalizeRole(req.body?.role) ?? "Crew";
  if (!name || name.length > 100) {
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
  const role = normalizeRole(req.body?.role);
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
  const rawStatus = typeof req.body?.status === "string" ? req.body.status.trim() : "";
  const status = rawStatus.toUpperCase();
  const shift = typeof req.body?.shift === "string" ? req.body.shift.trim().toUpperCase() : "";

  if (
    !Number.isInteger(personnelId) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate) ||
    !STATUSES.has(status)
  ) {
    res.status(400).json({ error: "Data absensi tidak valid." });
    return;
  }
  if (
    (status === "P" && !/^P(6|7|8|9|10|11|12)$/.test(shift)) ||
    (status === "S" && !/^S(13|14|15|16|17|18)$/.test(shift)) ||
    (status === "M" && !/^M(19|20|21|22|23)$/.test(shift)) ||
    (!["P", "S", "M"].includes(status) && shift !== "")
  ) {
    res.status(400).json({ error: "Detail shift tidak sesuai dengan status absensi." });
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
    .values({
      storeId: store.id,
      personnelId,
      attendanceDate,
      status,
      shift,
    })
    .onConflictDoUpdate({
      target: [absensiEntriesTable.personnelId, absensiEntriesTable.attendanceDate],
      set: { status, shift },
    })
    .returning();
  res.json({ entry });
});

router.delete("/absensi/attendance", requireCustomer, async (req, res): Promise<void> => {
  const store = await getEntitledStore(req, res);
  if (!store) return;
  const personnelId = Number(req.body?.personnelId);
  const attendanceDate =
    typeof req.body?.attendanceDate === "string" ? req.body.attendanceDate : "";
  if (!Number.isInteger(personnelId) || !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    res.status(400).json({ error: "Data absensi tidak valid." });
    return;
  }
  await db
    .delete(absensiEntriesTable)
    .where(
      and(
        eq(absensiEntriesTable.storeId, store.id),
        eq(absensiEntriesTable.personnelId, personnelId),
        eq(absensiEntriesTable.attendanceDate, attendanceDate),
      ),
    );
  res.json({ ok: true });
});

export default router;