import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, desc, gte } from "drizzle-orm";
import {
  AdminListOrdersQueryParams,
  AdminListOrdersResponse,
  AdminUpdateOrderStatusParams,
  AdminUpdateOrderStatusBody,
  AdminUpdateOrderStatusResponse,
  AdminGetStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session.isAdmin) return next();
  res.status(401).json({ error: "Unauthorized" });
}

function serializeOrder(order: typeof ordersTable.$inferSelect) {
  return {
    ...order,
    items: order.items as Array<{
      productId?: number;
      productName: string;
      price: number;
      quantity: number;
      kode?: string;
      pin?: string;
    }>,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

router.post("/admin/login", (req: Request, res: Response) => {
  const { password } = req.body as { password?: string };
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Password salah" });
    return;
  }
  req.session.isAdmin = true;
  res.json({ ok: true });
});

router.post("/admin/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/admin/me", (req: Request, res: Response) => {
  res.json({ isAdmin: !!req.session.isAdmin });
});

router.get("/admin/orders", requireAdmin, async (req, res): Promise<void> => {
    const params = AdminListOrdersQueryParams.safeParse(req.query);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const { status } = params.data;

    const orders = status
      ? await db
          .select()
          .from(ordersTable)
          .where(eq(ordersTable.status, status))
          .orderBy(desc(ordersTable.createdAt))
      : await db
          .select()
          .from(ordersTable)
          .orderBy(desc(ordersTable.createdAt));

    res.json(AdminListOrdersResponse.parse(orders.map(serializeOrder)));
  });
    

router.patch("/admin/orders/:orderId/status", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
  const params = AdminUpdateOrderStatusParams.safeParse({ orderId: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = AdminUpdateOrderStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: body.data.status })
    .where(eq(ordersTable.orderId, params.data.orderId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(AdminUpdateOrderStatusResponse.parse(serializeOrder(updated)));
});

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const allOrders = await db.select().from(ordersTable);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayOrders = await db
    .select()
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, todayStart));

  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter((o) => o.status === "pending" || o.status === "proof_uploaded").length;
  const confirmedOrders = allOrders.filter((o) => o.status === "confirmed").length;
  const cancelledOrders = allOrders.filter((o) => o.status === "cancelled").length;
  const totalRevenue = allOrders
    .filter((o) => o.status === "confirmed")
    .reduce((sum, o) => sum + o.total, 0);
  const todayCount = todayOrders.length;
  const todayRevenue = todayOrders
    .filter((o) => o.status === "confirmed")
    .reduce((sum, o) => sum + o.total, 0);

  res.json(
    AdminGetStatsResponse.parse({
      totalOrders,
      pendingOrders,
      confirmedOrders,
      cancelledOrders,
      totalRevenue,
      todayOrders: todayCount,
      todayRevenue,
    })
  );
});

router.delete("/admin/cleanup", requireAdmin, async (_req, res): Promise<void> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Only clean orders older than 30 days that are confirmed or cancelled
  const { lt } = await import("drizzle-orm");
  const toClean = await db
    .select()
    .from(ordersTable)
    .where(lt(ordersTable.createdAt, thirtyDaysAgo));

  let cleaned = 0;
  for (const o of toClean) {
    if (o.status === "confirmed" || o.status === "cancelled") {
      await db
        .update(ordersTable)
        .set({
          items: [],
          notes: null,
          paymentProofUrl: null,
          customerEmail: "-",
          customerPhone: "-",
        })
        .where(eq(ordersTable.id, o.id));
      cleaned++;
    }
  }

  res.json({ ok: true, cleaned });
});

export default router;
