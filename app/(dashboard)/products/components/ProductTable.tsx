"use client";

import { AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { type Product } from "@/components/pos-data-provider";
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
import { Package } from "lucide-react";
import { ProductTableRow } from "./ProductTableRow";

interface ProductTableProps {
  products: Product[];
  searchQuery: string;
  filterCategory: string;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  itemVariants: any;
}

export function ProductTable({
  products,
  searchQuery,
  filterCategory,
  onEdit,
  onDelete,
  itemVariants,
}: ProductTableProps) {
  const { t } = useLanguage();
  return (
    <div className="overflow-x-auto min-w-0">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold text-start">{t("products.product")}</TableHead>
            <TableHead className="font-semibold text-start">{t("products.category")}</TableHead>
            <TableHead className="font-semibold text-start">{t("products.price")}</TableHead>
            <TableHead className="font-semibold text-start">{t("products.unit")}</TableHead>
            <TableHead className="font-semibold text-start">{t("products.stock")}</TableHead>
            <TableHead className="text-end font-semibold">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  variants={itemVariants}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </EmptyMedia>
                      <EmptyTitle>{t("products.noProductsFound")}</EmptyTitle>
                      <EmptyDescription>
                        {searchQuery || filterCategory !== "all"
                          ? t("products.tryAdjustingSearch")
                          : t("products.getStartedAdding")}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
