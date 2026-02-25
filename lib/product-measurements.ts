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
  if (saleType === "rental") return DEFAULT_RENTAL_UNIT_LABEL;
  return DEFAULT_ITEM_UNIT_LABEL;
}

export function getUnitIncrement(product?: Product | null): number {
  const saleType = getSaleType(product);
  const increment = product?.unitIncrement;
  if (increment && increment > 0) {
    return increment;
  }
  if (saleType === "weight") return DEFAULT_WEIGHT_INCREMENT;
  if (saleType === "rental") return DEFAULT_RENTAL_INCREMENT;
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

export function getProductUnitPrice(product?: Product | null): number {
  const saleType = getSaleType(product);
  const sellingPrice =
    typeof product?.price === "number" && product.price >= 0 ? product.price : 0;
  const rentalPrice =
    typeof product?.rentalPrice === "number" && product.rentalPrice >= 0
      ? product.rentalPrice
      : sellingPrice;
  return saleType === "rental" ? rentalPrice : sellingPrice;
}

export function getProductUnitPriceForVariation(
  product?: Product | null,
  variation?: { price?: number; rentalPrice?: number } | null
): number {
  if (!product) return 0;
  if (!variation) return getProductUnitPrice(product);
  const saleType = getSaleType(product);
  const base = getProductUnitPrice(product);
  const variationSell =
    typeof variation.price === "number" && variation.price >= 0
      ? variation.price
      : base;
  const variationRent =
    typeof variation.rentalPrice === "number" && variation.rentalPrice >= 0
      ? variation.rentalPrice
      : variationSell;
  return saleType === "rental" ? variationRent : variationSell;
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
