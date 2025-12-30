/**
 * Calculates the total price for an article item, considering packaging_unit.
 * 
 * The formula: price × packaging_unit × quantity
 * 
 * @param price - Unit price of the article
 * @param packagingUnit - Number of pieces per packaging unit (defaults to 1)
 * @param quantity - Number of packaging units ordered
 * @returns The total price for this item
 */
export const calculateItemTotal = (
  price: number | string | null | undefined,
  packagingUnit: number | string | null | undefined,
  quantity: number
): number => {
  const priceNum = Number(price) || 0;
  const packagingNum = Number(packagingUnit) || 1;
  return priceNum * packagingNum * quantity;
};
