"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { type Category } from "@/components/pos-data-provider";

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  isTablet?: boolean;
}

export function CategoryFilter({
  categories: categoriesProp,
  activeCategory,
  onCategoryChange,
  isTablet = false,
}: CategoryFilterProps) {
  const { t } = useLanguage();
  const categories = Array.isArray(categoriesProp) ? categoriesProp : [];

  const handleAllClick = useCallback(() => {
    onCategoryChange("all");
  }, [onCategoryChange]);

  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      onCategoryChange(categoryId);
    },
    [onCategoryChange]
  );

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div className="overflow-x-auto overflow-y-hidden pb-1 -mx-1 px-1">
        <div className="flex gap-2 w-max min-w-full whitespace-nowrap">
          <Button
            type="button"
            variant={activeCategory === "all" ? "default" : "outline"}
            size={isTablet ? "default" : "sm"}
            onClick={handleAllClick}
            className={`rounded-full flex-shrink-0 ${
              isTablet ? "h-10 px-5" : "h-9 px-4"
            } font-medium transition-colors shadow-sm hover:shadow-md ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground"
                : ""
            }`}
          >
            {t("sales.allProducts")}
          </Button>

          {categories.map((category) => (
            <Button
              type="button"
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size={isTablet ? "default" : "sm"}
              onClick={() => handleCategoryClick(category.id)}
              className={`rounded-full flex-shrink-0 ${
                isTablet ? "h-10 px-5" : "h-9 px-4"
              } font-medium transition-colors shadow-sm hover:shadow-md ${
                activeCategory === category.id ? "scale-105" : ""
              }`}
              style={
                category.color
                  ? {
                      backgroundColor:
                        activeCategory === category.id
                          ? category.color
                          : "transparent",
                      color:
                        activeCategory === category.id
                          ? "white"
                          : category.color,
                      borderColor: category.color,
                      borderWidth:
                        activeCategory === category.id ? "2px" : "1px",
                    }
                  : undefined
              }
            >
              {category.icon && <span className="mr-1.5">{category.icon}</span>}
              {category.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
