import { pool } from "@workspace/db";

export const NEW_MEMBER_FRESH = "NEW MEMBER FRESH";
export const DEFAULT_MEMBER_PRICING = {
  regularPrice: 6500,
  bulkPrice: 6000,
  bulkMin: 10,
};
export type MemberPricing = typeof DEFAULT_MEMBER_PRICING;

let tableReady: Promise<void> | null = null;

async function ensureMemberPricingTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS store_settings (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await pool.query(
        "INSERT INTO store_settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO NOTHING",
        ["member_pricing", JSON.stringify(DEFAULT_MEMBER_PRICING)],
      );
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  await tableReady;
}

function sanitizePricing(value: unknown): MemberPricing {
  const candidate = value && typeof value === "object"
    ? value as Partial<MemberPricing>
    : {};
  const regularPrice = Number(candidate.regularPrice);
  const bulkPrice = Number(candidate.bulkPrice);
  const bulkMin = Number(candidate.bulkMin);
  return {
    regularPrice: Number.isSafeInteger(regularPrice) && regularPrice >= 0
      ? regularPrice : DEFAULT_MEMBER_PRICING.regularPrice,
    bulkPrice: Number.isSafeInteger(bulkPrice) && bulkPrice >= 0
      ? bulkPrice : DEFAULT_MEMBER_PRICING.bulkPrice,
    bulkMin: Number.isSafeInteger(bulkMin) && bulkMin >= 2 && bulkMin <= 100000
      ? bulkMin : DEFAULT_MEMBER_PRICING.bulkMin,
  };
}

export async function getMemberPricing(): Promise<MemberPricing> {
  await ensureMemberPricingTable();
  const result = await pool.query("SELECT value FROM store_settings WHERE key = $1 LIMIT 1", ["member_pricing"]);
  return sanitizePricing(result.rows[0]?.value);
}

export async function saveMemberPricing(value: unknown): Promise<MemberPricing> {
  const candidate = value && typeof value === "object"
    ? value as Partial<MemberPricing>
    : {};
  const regularPrice = Number(candidate.regularPrice);
  const bulkPrice = Number(candidate.bulkPrice);
  const bulkMin = Number(candidate.bulkMin);
  if (!Number.isSafeInteger(regularPrice) || regularPrice < 0 || regularPrice > 100000000 ||
      !Number.isSafeInteger(bulkPrice) || bulkPrice < 0 || bulkPrice > 100000000 ||
      !Number.isSafeInteger(bulkMin) || bulkMin < 2 || bulkMin > 100000) {
    throw new Error("Harga harus berupa angka bulat non-negatif dan minimal grosir antara 2–100.000 member.");
  }
  const pricing: MemberPricing = { regularPrice, bulkPrice, bulkMin };
  await ensureMemberPricingTable();
  await pool.query(
    "INSERT INTO store_settings (key, value, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
    ["member_pricing", JSON.stringify(pricing)],
  );
  return pricing;
}

export function getEffectiveUnitPrice(
  productName: string,
  quantity: number,
  currentPrice: number,
  pricing: MemberPricing = DEFAULT_MEMBER_PRICING,
): number {
  if (productName !== NEW_MEMBER_FRESH) return currentPrice;
  return quantity >= pricing.bulkMin ? pricing.bulkPrice : pricing.regularPrice;
}
