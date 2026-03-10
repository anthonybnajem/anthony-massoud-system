"use client";

import {
  Table,
  TableBody,
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
import { Package } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { InventoryTableRow } from "./InventoryTableRow";
import { type Product } from "@/components/pos-data-provider";
import { AnimatePresence } from "framer-motion";

interface InventoryTableProps {
  products: Product[];
  onAdjust: (product: Product) => void;
  itemVariants?: any;
}

export function InventoryTable({
  products,
  onAdjust,
  itemVariants,
}: InventoryTableProps) {
  const { t } = useLanguage();
  if (products.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Package className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>{t("products.noProductsFound")}</EmptyTitle>
          <EmptyDescription>
            {t("inventory.noProductsMatchFilter")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px] text-start">{t("products.product")}</TableHead>
            <TableHead className="text-start">{t("products.category")}</TableHead>
            <TableHead className="text-start">{t("products.stock")}</TableHead>
            <TableHead className="text-start">{t("inventory.cost")}</TableHead>
            <TableHead className="text-start">{t("inventory.value")}</TableHead>
            <TableHead className="w-[70px] text-end">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {products.map((product) => (
              <InventoryTableRow
                key={product.id}
                product={product}
                onAdjust={onAdjust}
                variants={itemVariants}
              />
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
