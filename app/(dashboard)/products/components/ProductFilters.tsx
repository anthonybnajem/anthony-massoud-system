"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import { type Category } from "@/components/pos-data-provider";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  categories: Category[];
  onAddProduct: () => void;
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  filterCategory,
  onFilterCategoryChange,
  sortBy,
  onSortByChange,
  categories,
  onAddProduct,
}: ProductFiltersProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={t("products.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="ps-9 h-11 border-2 focus:border-primary transition-colors"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <Select value={filterCategory} onValueChange={onFilterCategoryChange}>
            <SelectTrigger className="w-[180px]">
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

          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("inventory.sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">{t("inventory.name")}</SelectItem>
              <SelectItem value="price">{t("products.price")}</SelectItem>
              <SelectItem value="stock">{t("products.stock")}</SelectItem>
              <SelectItem value="category">{t("products.category")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={onAddProduct} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("products.quickAdd")}
          </Button>
          <Link href="/products/new">
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" color="white"/>
              {t("products.createNewProduct")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
