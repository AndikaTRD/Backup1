export const NEW_MEMBER_FRESH = "NEW MEMBER FRESH";
export const NEW_MEMBER_FRESH_BULK_MIN = 10;
export const NEW_MEMBER_FRESH_REGULAR_PRICE = 6500;
export const NEW_MEMBER_FRESH_BULK_PRICE = 6000;

export type MemberPricing = {
  regularPrice: number;
  bulkPrice: number;
  bulkMin: number;
};

export const DEFAULT_MEMBER_PRICING: MemberPricing = {
  regularPrice: NEW_MEMBER_FRESH_REGULAR_PRICE,
  bulkPrice: NEW_MEMBER_FRESH_BULK_PRICE,
  bulkMin: NEW_MEMBER_FRESH_BULK_MIN,
};

export function getNewMemberFreshUnitPrice(
  quantity: number,
  pricing: MemberPricing = DEFAULT_MEMBER_PRICING,
): number {
  return quantity >= pricing.bulkMin ? pricing.bulkPrice : pricing.regularPrice;
}

export function getEffectiveUnitPrice(
  productName: string,
  quantity: number,
  currentPrice: number,
  pricing: MemberPricing = DEFAULT_MEMBER_PRICING,
): number {
  return productName === NEW_MEMBER_FRESH
    ? getNewMemberFreshUnitPrice(quantity, pricing)
    : currentPrice;
}

export function getEffectiveLineTotal(
  productName: string,
  quantity: number,
  currentPrice: number,
  pricing: MemberPricing = DEFAULT_MEMBER_PRICING,
): number {
  return getEffectiveUnitPrice(productName, quantity, currentPrice, pricing) * quantity;
}
