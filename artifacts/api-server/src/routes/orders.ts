import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import {
  CreateOrderBody,
  CreateOrderResponse,
  GetOrderParams,
  GetOrderResponse,
  UploadPaymentProofParams,
  UploadPaymentProofBody,
  UploadPaymentProofResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function generateOrderId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(100 + Math.random() * 900);
  return `ANDK${rand}-${date}`;
}

const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

const uploadsDir = path.resolve(workspaceRoot, "artifacts/api-server/uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

function serializeOrder(order: typeof ordersTable.$inferSelect) {
  return {
    ...order,
    items: order.items as Array<{ productId: number; productName: string; price: number; quantity: number }>,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

router.post("/orders/save", async (req, res): Promise<void> => {
  const { orderId, customerName, items, paymentMethod, proofUrl, total } = req.body as {
    orderId: string;
    customerName: string;
    items: Array<{ productName: string; price: number; quantity: number; kode: string; pin: string }>;
    paymentMethod: string;
    proofUrl?: string;
    total: number;
  };

  if (!orderId || !customerName || !items?.length || !paymentMethod) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }

  const [order] = await db
    .insert(ordersTable)
    .values({
      orderId,
      customerName,
      customerEmail: "-",
      customerPhone: "-",
      items,
      total,
      paymentMethod,
      status: "pending",
      paymentProofUrl: proofUrl ?? null,
    })
    .returning();

  req.log.info({ orderId }, "Order saved");
  res.status(201).json({ ok: true, orderId: order.orderId });
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { customerName, customerEmail, customerPhone, items, paymentMethod, notes } = parsed.data;
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderId = generateOrderId();

  const [order] = await db
    .insert(ordersTable)
    .values({
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      items,
      total,
      paymentMethod,
      status: "pending",
      notes: notes ?? null,
    })
    .returning();

  req.log.info({ orderId }, "Order created");
  res.status(201).json(CreateOrderResponse.parse(serializeOrder(order)));
});

router.get("/orders/:orderId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
  const params = GetOrderParams.safeParse({ orderId: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.orderId, params.data.orderId));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(GetOrderResponse.parse(serializeOrder(order)));
});

router.post("/orders/:orderId/payment-proof", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.orderId)
    ? req.params.orderId[0]
    : req.params.orderId;

  const params = UploadPaymentProofParams.safeParse({
    orderId: rawId,
  });

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UploadPaymentProofBody.safeParse(req.body);

  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderId, params.data.orderId));

  if (!existing) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const apiKey = process.env.IMGBB_API_KEY;

  if (!apiKey) {
    req.log.error("IMGBB_API_KEY tidak ditemukan");
    res.status(500).json({
      error: "IMGBB_API_KEY tidak dikonfigurasi",
    });
    return;
  }

  try {
    const base64Data = body.data.imageBase64.replace(
      /^data:[^;]+;base64,/,
      "",
    );

    const form = new URLSearchParams();
    form.set("key", apiKey);
    form.set("image", base64Data);
    form.set("name", `${params.data.orderId}-proof`);

    const imgbbRes = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: form,
    });

    if (!imgbbRes.ok) {
      const errorText = await imgbbRes.text();

      req.log.error(
        {
          status: imgbbRes.status,
          body: errorText,
        },
        "ImgBB upload failed",
      );

      res.status(502).json({
        error: "Gagal upload ke ImgBB",
      });

      return;
    }

    const json = (await imgbbRes.json()) as {
      success: boolean;
      data: {
        url: string;
        display_url: string;
      };
    };

    if (!json.success) {
      req.log.error(json, "ImgBB returned unsuccessful response");

      res.status(502).json({
        error: "Upload ImgBB gagal",
      });

      return;
    }

    const proofUrl = json.data.display_url || json.data.url;

    const [updated] = await db
      .update(ordersTable)
      .set({
        paymentProofUrl: proofUrl,
        status: "proof_uploaded",
      })
      .where(eq(ordersTable.orderId, params.data.orderId))
      .returning();

    req.log.info(
      {
        orderId: params.data.orderId,
        proofUrl,
      },
      "Payment proof uploaded to ImgBB",
    );

    res.json(
      UploadPaymentProofResponse.parse(
        serializeOrder(updated),
      ),
    );
  } catch (err) {
    req.log.error(
      { err },
      "Unexpected error while uploading payment proof",
    );

    res.status(500).json({
      error: "Terjadi kesalahan saat upload bukti pembayaran",
    });
  }
});

export default router;
