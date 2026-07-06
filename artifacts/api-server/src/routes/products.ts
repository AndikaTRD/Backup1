import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetProductParams,
  GetProductResponse,
  ListProductsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (_req, res): Promise<void> => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.isActive, true));

    res.json(ListProductsResponse.parse(products));
  } catch (err) {
    console.error("PRODUCTS ERROR:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(product));
});

export default router;
