export const NEW_MEMBER_FRESH = "NEW MEMBER FRESH";
export const NEW_MEMBER_FRESH_BULK_MIN = 10;
export const NEW_MEMBER_FRESH_REGULAR_PRICE = 6500;
export const NEW_MEMBER_FRESH_BULK_PRICE = 6000;

export function getNewMemberFreshUnitPrice(quantity: number): number {
  return quantity >= NEW_MEMBER_FRESH_BULK_MIN
    ? NEW_MEMBER_FRESH_BULK_PRICE
    : NEW_MEMBER_FRESH_REGULAR_PRICE;
}

export function getEffectiveUnitPrice(
  productName: string,
  quantity: number,
  currentPrice: number,
): number {
  return productName === NEW_MEMBER_FRESH
    ? getNewMemberFreshUnitPrice(quantity)
    : currentPrice;
}

export function getEffectiveLineTotal(
  productName: string,
  quantity: number,
  currentPrice: number,
): number {
  return getEffectiveUnitPrice(productName, quantity, currentPrice) * quantity;
}