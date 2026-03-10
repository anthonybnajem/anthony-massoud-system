"use client";

import { useLanguage } from "@/components/language-provider";
import { type Discount } from "@/lib/db";
import {
  type Product,
  type Category,
} from "@/components/pos-data-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Tag } from "lucide-react";
import { DiscountTableRow } from "./DiscountTableRow";

interface DiscountTableProps {
  discounts: Discount[];
  onEdit: (discount: Discount) => void;
  onDelete: (id: string) => void;
  products: Product[];
  categories: Category[];
  currencySymbol: string;
}

export function DiscountTable({
  discounts,
  onEdit,
  onDelete,
  products,
  categories,
  currencySymbol,
}: DiscountTableProps) {
  const { t } = useLanguage();
  const productMap = new Map(products.map((product) => [product.id, product]));
  const categoryMap = new Map(
    categories.map((category) => [category.id, category])
  );

  return (
    <div className="overflow-x-auto min-w-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("discounts.nameHeader")}</TableHead>
            <TableHead>{t("discounts.codeHeader")}</TableHead>
            <TableHead>{t("discounts.valueHeader")}</TableHead>
            <TableHead>{t("discounts.appliesToHeader")}</TableHead>
            <TableHead>{t("discounts.targetsHeader")}</TableHead>
            <TableHead>{t("discounts.statusHeader")}</TableHead>
            <TableHead>{t("discounts.actionsHeader")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {discounts.length > 0 ? (
            discounts.map((discount) => (
              <DiscountTableRow
                key={discount.id}
                discount={discount}
                onEdit={onEdit}
                onDelete={onDelete}
                productMap={productMap}
                categoryMap={categoryMap}
                currencySymbol={currencySymbol}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="py-8">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Tag className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>{t("discounts.noDiscountsFound")}</EmptyTitle>
                    <EmptyDescription>
                      {t("discounts.noDiscountsDesc")}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
