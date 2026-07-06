import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetCartQueryParams,
  GetCartResponse,
  AddToCartBody,
  AddToCartResponse,
  RemoveFromCartParams,
  RemoveFromCartResponse,
  ClearCartParams,
  ClearCartResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// In-memory cart store (sessionId -> CartItem[])
const cartStore: Map<string, Array<{ productId: number; productName: string; price: number; quantity: number }>> = new Map();

function buildCartResponse(sessionId: string) {
  const items = cartStore.get(sessionId) ?? [];
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { sessionId, items, total };
}

router.get("/cart", async (req, res): Promise<void> => {
  const params = GetCartQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { sessionId } = params.data;
  res.json(GetCartResponse.parse(buildCartResponse(sessionId)));
});

router.post("/cart", async (req, res): Promise<void> => {
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sessionId, productId, quantity } = parsed.data;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const items = cartStore.get(sessionId) ?? [];
  const existingIdx = items.findIndex((i) => i.productId === productId);

  if (existingIdx >= 0) {
    items[existingIdx].quantity += quantity;
  } else {
    items.push({ productId, productName: product.name, price: product.price, quantity });
  }

  cartStore.set(sessionId, items);
  res.json(AddToCartResponse.parse(buildCartResponse(sessionId)));
});

router.delete("/cart/:sessionId/items/:productId", async (req, res): Promise<void> => {
  const rawSession = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const rawProduct = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;

  const params = RemoveFromCartParams.safeParse({ sessionId: rawSession, productId: parseInt(rawProduct, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { sessionId, productId } = params.data;
  const items = (cartStore.get(sessionId) ?? []).filter((i) => i.productId !== productId);
  cartStore.set(sessionId, items);

  res.json(RemoveFromCartResponse.parse(buildCartResponse(sessionId)));
});

router.delete("/cart/:sessionId", async (req, res): Promise<void> => {
  const rawSession = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
  const params = ClearCartParams.safeParse({ sessionId: rawSession });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { sessionId } = params.data;
  cartStore.set(sessionId, []);

  res.json(ClearCartResponse.parse(buildCartResponse(sessionId)));
});

export default router;
