import type { Product } from "./db";
import {
  DEFAULT_ITEM_INCREMENT,
  DEFAULT_ITEM_UNIT_LABEL,
  DEFAULT_RENTAL_INCREMENT,
  DEFAULT_RENTAL_UNIT_LABEL,
  DEFAULT_WEIGHT_INCREMENT,
  DEFAULT_WEIGHT_UNIT_LABEL,
  type ProductSaleType,
} from "./product-constants";

export function getSaleType(product?: Product | null): ProductSaleType {
  if (product?.saleType === "weight") return "weight";
  if (product?.saleType === "rental") return "rental";
  if (product?.saleType === "item_and_rental") return "item_and_rental";
  return "item";
}

export function isWeightBased(product?: Product | null): boolean {
  return getSaleType(product) === "weight";
}

export function getUnitLabel(product?: Product | null): string {
  const saleType = getSaleType(product);
  const label = product?.unitLabel?.trim();
  if (label) {
    return label;
  }
  if (saleType === "weight") return DEFAULT_WEIGHT_UNIT_LABEL;
  if (saleType === "rental" || saleType === "item_and_rental") return DEFAULT_RENTAL_UNIT_LABEL;
  return DEFAULT_ITEM_UNIT_LABEL;
}

export function getUnitIncrement(product?: Product | null): number {
  const saleType = getSaleType(product);
  const increment = product?.unitIncrement;
  if (increment && increment > 0) {
    return increment;
  }
  if (saleType === "weight") return DEFAULT_WEIGHT_INCREMENT;
  if (saleType === "rental" || saleType === "item_and_rental") return DEFAULT_RENTAL_INCREMENT;
  return DEFAULT_ITEM_INCREMENT;
}

export function formatMeasurementValue(
  value: number,
  maxDecimals = 3
): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(maxDecimals).replace(/\.?0+$/, "");
}

/** Get unit price. For item_and_rental use preferRental to get rent vs sale price. */
export function getProductUnitPrice(
  product?: Product | null,
  preferRental?: boolean
): number {
  const saleType = getSaleType(product);
  const sellingPrice =
    typeof product?.price === "number" && product.price >= 0 ? product.price : 0;
  const rentalPrice =
    typeof product?.rentalPrice === "number" && product.rentalPrice >= 0
      ? product.rentalPrice
      : sellingPrice;
  if (saleType === "item_and_rental") {
    return preferRental ? rentalPrice : sellingPrice;
  }
  if (saleType === "rental") return rentalPrice;
  if ((saleType === "item" || saleType === "weight") && preferRental && rentalPrice > 0) {
    return rentalPrice;
  }
  return sellingPrice;
}

export function getProductUnitPriceForVariation(
  product?: Product | null,
  variation?: { price?: number; rentalPrice?: number } | null,
  /** When product saleType is item_and_rental, use this to pick rent vs sale price. */
  preferRental?: boolean
): number {
  if (!product) return 0;
  if (!variation) return getProductUnitPrice(product, preferRental);
  const saleType = getSaleType(product);
  const baseSell =
    typeof product?.price === "number" && product.price >= 0 ? product.price : 0;
  const baseRent =
    typeof product?.rentalPrice === "number" && product.rentalPrice >= 0
      ? product.rentalPrice
      : baseSell;
  const variationSell =
    typeof variation.price === "number" && variation.price >= 0
      ? variation.price
      : baseSell;
  const variationRent =
    typeof variation.rentalPrice === "number" && variation.rentalPrice >= 0
      ? variation.rentalPrice
      : variationSell;
  if (saleType === "item_and_rental") {
    return preferRental ? variationRent : variationSell;
  }
  if (saleType === "rental") return variationRent;
  if ((saleType === "item" || saleType === "weight") && preferRental && variationRent > 0) {
    return variationRent;
  }
  return variationSell;
}

export function formatQuantityWithLabel(
  product?: Product | null,
  quantity = 0
): string {
  const formatted = formatMeasurementValue(quantity);
  return `${formatted} ${getUnitLabel(product)}`.trim();
}

export function formatStockDisplay(product?: Product | null): string {
  const formatted = formatMeasurementValue(product?.stock ?? 0);
  if (isWeightBased(product)) {
    return `${formatted} ${getUnitLabel(product)}`.trim();
  }
  return formatted;
}
