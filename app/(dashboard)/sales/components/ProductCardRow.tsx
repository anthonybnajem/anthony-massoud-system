"use client";

import { type Product } from "@/components/pos-data-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";
import { Plus, Package } from "lucide-react";
import {
  formatStockDisplay,
  getProductUnitPrice,
  getSaleType,
  getUnitLabel,
} from "@/lib/product-measurements";

interface ProductCardRowProps {
  product: Product;
  currencySymbol: string;
  onAddToCart: (product: Product) => void;
  onQuickAdd: (e: React.MouseEvent, product: Product) => void;
  isTablet?: boolean;
}

export function ProductCardRow({
  product,
  currencySymbol,
  onAddToCart,
  onQuickAdd,
  isTablet = false,
}: ProductCardRowProps) {
  const { t } = useLanguage();
  const saleType = getSaleType(product);
  const unitLabel = getUnitLabel(product);
  const unitPrice = getProductUnitPrice(product);
  const stockLabel = formatStockDisplay(product);

  return (
    <Card
      className="card flex flex-row items-center gap-3 p-3 cursor-pointer active:scale-[0.99] transition-all touch-manipulation hover:shadow-sm border"
      onClick={() => onAddToCart(product)}
    >
      <div className="h-14 w-14 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <Package className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm truncate">{product.name}</span>
          {product.stock <= 5 && (
            <Badge
              variant={product.stock === 0 ? "destructive" : "secondary"}
              className="text-[10px] px-1.5 py-0 shrink-0"
            >
              {product.stock === 0 ? t("sales.stockOut") : `${stockLabel} ${t("sales.stockLeft")}`}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {product.category?.name || t("sales.uncategorized")}
          {product.sku && ` · ${t("sales.sku")}: ${product.sku}`}
        </p>
        <p className="text-sm font-bold text-primary">
          {currencySymbol}
          {unitPrice.toFixed(2)}
          <span className="ml-1 text-xs font-medium text-muted-foreground">/ {unitLabel}</span>
          {saleType === "rental" && (
            <Badge variant="outline" className="ml-1.5 text-[10px] uppercase">
              {t("sales.rentalItem")}
            </Badge>
          )}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 h-9 font-medium touch-manipulation"
        onClick={(e) => {
          e.stopPropagation();
          onQuickAdd(e, product);
        }}
        disabled={product.stock === 0}
      >
        <Plus className="h-4 w-4 mr-1" />
        {t("sales.add")}
      </Button>
    </Card>
  );
}
