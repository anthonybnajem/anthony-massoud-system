"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { type Category } from "@/components/pos-data-provider";
import { useLanguage } from "@/components/language-provider";

interface InventoryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (value: string) => void;
  stockStatus: string;
  onStockStatusChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  categories: Category[];
}

export function InventoryFilters({
  searchQuery,
  onSearchChange,
  filterCategory,
  onFilterCategoryChange,
  stockStatus,
  onStockStatusChange,
  sortBy,
  onSortByChange,
  categories,
}: InventoryFiltersProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={t("inventory.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-11 border-2 focus:border-primary transition-colors"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterCategory} onValueChange={onFilterCategoryChange}>
          <SelectTrigger className="w-[180px] border-2">
            <SelectValue placeholder={t("products.category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("inventory.allCategories")}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stockStatus} onValueChange={onStockStatusChange}>
          <SelectTrigger className="w-[180px] border-2">
            <SelectValue placeholder={t("inventory.stockStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("inventory.allStatus")}</SelectItem>
            <SelectItem value="in_stock">{t("inventory.inStock")}</SelectItem>
            <SelectItem value="low_stock">{t("inventory.lowStock")}</SelectItem>
            <SelectItem value="out_of_stock">{t("inventory.outOfStock")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-[180px] border-2">
            <SelectValue placeholder={t("inventory.sortBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{t("inventory.name")}</SelectItem>
            <SelectItem value="stock">{t("inventory.stockLevel")}</SelectItem>
            <SelectItem value="category">{t("products.category")}</SelectItem>
            <SelectItem value="value">{t("inventory.value")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
