"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Package } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { type Product } from "@/components/pos-data-provider";
import { motion } from "framer-motion";
import {
  formatStockDisplay,
  getUnitLabel,
} from "@/lib/product-measurements";

interface InventoryTableRowProps {
  product: Product;
  onAdjust: (product: Product) => void;
  variants?: any;
}

export function InventoryTableRow({
  product,
  onAdjust,
  variants,
}: InventoryTableRowProps) {
  const { t } = useLanguage();
  const getStockStatus = () => {
    if (product.stock === 0) {
      return { label: t("inventory.outOfStock"), variant: "destructive" as const };
    } else if (product.stock <= 5) {
      return { label: t("inventory.lowStock"), variant: "secondary" as const };
    }
    return { label: t("inventory.inStock"), variant: "default" as const };
  };

  const stockStatus = getStockStatus();
  const inventoryValue = (product.cost || 0) * product.stock;
  const unitLabel = getUnitLabel(product);
  const formattedStock = formatStockDisplay(product);

  return (
    <tr
      className="hover:bg-muted/50 transition-colors"
    >
      <TableCell className="font-medium text-start">
        <div className="flex items-center gap-3 justify-start text-start">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="w-10 h-10 rounded-md object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="font-semibold">{product.name}</div>
            {product.sku && (
              <div className="text-xs text-muted-foreground">
                SKU: {product.sku}
              </div>
            )}
            {product.barcode && (
              <div className="text-xs text-muted-foreground">
                Barcode: {product.barcode}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-start">
        <Badge variant="outline">
          {product.category?.name || "Uncategorized"}
        </Badge>
      </TableCell>
      <TableCell className="text-start">
        <div className="flex items-center gap-2 justify-start">
          <span className="font-semibold text-lg">{formattedStock}</span>
          <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
        </div>
      </TableCell>
      <TableCell className="text-start">
        <div className="text-sm">
          <div className="font-medium">${(product.cost || 0).toFixed(2)}</div>
          <div className="text-muted-foreground">{t("inventory.per")} {unitLabel}</div>
        </div>
      </TableCell>
      <TableCell className="text-start">
        <div className="font-semibold text-lg">
          ${inventoryValue.toFixed(2)}
        </div>
      </TableCell>
      <TableCell className="text-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAdjust(product)}>
              <Package className="me-2 h-4 w-4" />
              {t("inventory.adjustStock")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </tr>
  );
}
