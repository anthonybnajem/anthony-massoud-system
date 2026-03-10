"use client";

import { useLanguage } from "@/components/language-provider";
import { AnimatePresence } from "framer-motion";
import { type Category } from "@/components/pos-data-provider";
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
import { Tags } from "lucide-react";
import { CategoryTableRow } from "./CategoryTableRow";

interface CategoryTableProps {
  categories: Category[];
  searchQuery: string;
  getProductCount: (categoryId: string) => number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  itemVariants: any;
}

export function CategoryTable({
  categories,
  searchQuery,
  getProductCount,
  onEdit,
  onDelete,
  itemVariants,
}: CategoryTableProps) {
  const { t } = useLanguage();
  return (
    <div className="overflow-x-auto min-w-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-start">{t("categories.name")}</TableHead>
            <TableHead className="text-start">{t("categories.descriptionHeader")}</TableHead>
            <TableHead className="text-start">{t("categories.productsHeader")}</TableHead>
            <TableHead className="text-end">{t("categories.actionsHeader")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {categories.map((category) => (
              <CategoryTableRow
                key={category.id}
                category={category}
                productCount={getProductCount(category.id)}
                onEdit={onEdit}
                onDelete={onDelete}
                variants={itemVariants}
              />
            ))}
          </AnimatePresence>

          {categories.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-8">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Tags className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>{t("categories.noCategoriesFound")}</EmptyTitle>
                    <EmptyDescription>
                      {searchQuery
                        ? t("categories.noCategoriesSearchDesc")
                        : t("categories.noCategoriesEmptyDesc")}
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
