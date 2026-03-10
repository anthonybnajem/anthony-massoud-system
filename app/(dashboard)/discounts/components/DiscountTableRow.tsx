"use client";

import { useLanguage } from "@/components/language-provider";
import { type Discount } from "@/lib/db";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Percent, DollarSign, Edit, Trash2, MoreVertical } from "lucide-react";
import {
  type Product,
  type Category,
} from "@/components/pos-data-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DiscountTableRowProps {
  discount: Discount;
  onEdit: (discount: Discount) => void;
  onDelete: (id: string) => void;
  productMap: Map<string, Product>;
  categoryMap: Map<string, Category>;
  currencySymbol: string;
}

export function DiscountTableRow({
  discount,
  onEdit,
  onDelete,
  productMap,
  categoryMap,
  currencySymbol,
}: DiscountTableRowProps) {
  const { t } = useLanguage();
  const formatDiscountValue = (discount: Discount) => {
    return discount.type === "percentage"
      ? `${discount.value}`
      : `$${discount.value.toFixed(2)}`;
  };
  const targetDetails = () => {
    if (discount.appliesTo === "product") {
      const selectedProducts =
        discount.productIds
          ?.map((id) => productMap.get(id))
          .filter((product): product is Product => Boolean(product)) || [];
      if (selectedProducts.length === 0) {
        return <p className="text-sm text-muted-foreground">{t("discounts.noProductsSelected")}</p>;
      }
      return (
        <div className="space-y-1">
          {selectedProducts.slice(0, 3).map((product) => {
            const amountText =
              discount.type === "percentage"
                ? `${discount.value}% (${currencySymbol}${(
                    product.price * (discount.value / 100)
                  ).toFixed(2)})`
                : `${currencySymbol}${discount.value.toFixed(2)}`;
            return (
              <div
                key={product.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="truncate font-medium">{product.name}</span>
                <span className="text-muted-foreground">-{amountText}</span>
              </div>
            );
          })}
          {selectedProducts.length > 3 && (
            <p className="text-xs text-muted-foreground">
              {t("discounts.moreCount", { count: selectedProducts.length - 3 })}
            </p>
          )}
        </div>
      );
    }
    if (discount.appliesTo === "category") {
      const selectedCategories =
        discount.categoryIds
          ?.map((id) => categoryMap.get(id))
          .filter((category): category is Category => Boolean(category)) || [];
      if (selectedCategories.length === 0) {
        return <p className="text-sm text-muted-foreground">{t("discounts.noCategoriesSelected")}</p>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {selectedCategories.map((category) => (
            <Badge key={category.id} variant="secondary">
              {category.name}
            </Badge>
          ))}
        </div>
      );
    }
    if (discount.appliesTo === "all") {
      return <p className="text-sm text-muted-foreground">{t("discounts.allProducts")}</p>;
    }
    if (discount.appliesTo === "cart") {
      return (
        <p className="text-sm text-muted-foreground">
          {t("discounts.entireCartSubtotal")}
        </p>
      );
    }
    return null;
  };

  return (
    <TableRow key={discount.id}>
      <TableCell className="font-medium">{discount.name}</TableCell>
      <TableCell>{discount.code || "-"}</TableCell>
      <TableCell>
        <div className="flex items-center">
          {discount.type === "percentage" ? (
            <Percent className="me-1 h-4 w-4 text-muted-foreground" />
          ) : (
            <DollarSign className="me-1 h-4 w-4 text-muted-foreground" />
          )}
          {formatDiscountValue(discount)}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {discount.appliesTo === "all"
            ? t("discounts.badgeAllProducts")
            : discount.appliesTo === "cart"
            ? t("discounts.badgeCartTotal")
            : discount.appliesTo === "category"
            ? t("discounts.badgeCategories")
            : t("discounts.badgeSpecificProducts")}
        </Badge>
      </TableCell>
      <TableCell>{targetDetails()}</TableCell>
      <TableCell>
        <Badge variant={discount.isActive ? "default" : "secondary"}>
          {discount.isActive ? t("discounts.active") : t("discounts.inactive")}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(discount)}>
              <Edit className="me-2 h-4 w-4" />
              {t("common.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(discount.id)}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
