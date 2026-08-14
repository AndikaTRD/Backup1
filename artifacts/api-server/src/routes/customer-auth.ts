import { Router, type NextFunction, type Request, type Response } from "express";
import { customerUsersTable, db, ordersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const router = Router();
const scrypt = promisify(scryptCallback);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(hash, "hex");
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}

export function requireCustomer(req: Request, res: Response, next: NextFunction) {
  if (req.session.customerUserId) return next();
  res.status(401).json({ error: "Silakan login sebagai customer terlebih dahulu." });
}

export async function hasConfirmedAbsensiPurchase(userId: number) {
  const orders = await db
    .select({ items: ordersTable.items })
    .from(ordersTable)
    .where(and(eq(ordersTable.customerUserId, userId), eq(ordersTable.status, "confirmed")));

  return orders.some((order) => {
    const items = Array.isArray(order.items)
      ? (order.items as Array<{ productName?: unknown }>)
      : [];
    return items.some(
      (item) =>
        typeof item.productName === "string" &&
        item.productName.trim().toLowerCase() === "absensi toko",
    );
  });
}

router.post("/customer/register", async (req, res): Promise<void> => {
  const email = typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !email.includes("@") || password.length < 8) {
    res.status(400).json({ error: "Email valid dan password minimal 8 karakter wajib diisi." });
    return;
  }

  const [existing] = await db
    .select({ id: customerUsersTable.id })
    .from(customerUsersTable)
    .where(eq(customerUsersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "Email sudah terdaftar." });
    return;
  }

  const [user] = await db
    .insert(customerUsersTable)
    .values({ email, passwordHash: await hashPassword(password) })
    .returning({ id: customerUsersTable.id, email: customerUsersTable.email });

  req.session.customerUserId = user.id;
  res.status(201).json({ user: { id: user.id, email: user.email } });
});

router.post("/customer/login", async (req, res): Promise<void> => {
  const email = typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  const [user] = await db
    .select()
    .from(customerUsersTable)
    .where(eq(customerUsersTable.email, email));

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Email atau password salah." });
    return;
  }

  req.session.customerUserId = user.id;
  res.json({ user: { id: user.id, email: user.email } });
});

router.post("/customer/logout", (req, res) => {
  req.session.customerUserId = undefined;
  res.json({ ok: true });
});

router.get("/customer/me", async (req, res): Promise<void> => {
  if (!req.session.customerUserId) {
    res.json({ authenticated: false });
    return;
  }

  const [user] = await db
    .select({ id: customerUsersTable.id, email: customerUsersTable.email })
    .from(customerUsersTable)
    .where(eq(customerUsersTable.id, req.session.customerUserId));

  if (!user) {
    req.session.customerUserId = undefined;
    res.json({ authenticated: false });
    return;
  }

  res.json({ authenticated: true, user });
});

router.get("/customer/products", requireCustomer, async (req, res): Promise<void> => {
  const ownsAbsensi = await hasConfirmedAbsensiPurchase(req.session.customerUserId!);
  res.json({ ownsAbsensi });
});

export default router;