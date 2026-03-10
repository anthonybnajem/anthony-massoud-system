"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { usePosData, type Category } from "@/components/pos-data-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Package } from "lucide-react";
import { CategoryTable } from "./components/CategoryTable";
import { AddCategoryDialog } from "./components/AddCategoryDialog";
import { EditCategoryDialog } from "./components/EditCategoryDialog";
import { DeleteCategoryDialog } from "./components/DeleteCategoryDialog";
import { type CategoryFormValues } from "./components/CategoryForm";

export default function CategoriesPage() {
  const { t } = useLanguage();
  const {
    categories,
    products,
    addNewCategory,
    updateExistingCategory,
    removeCategory,
  } = usePosData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  // Filter categories
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description &&
        category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Count products per category
  const getProductCount = (categoryId: string) => {
    return products.filter((product) => product.categoryId === categoryId)
      .length;
  };

  // Handle adding a new category
  const handleAddCategory = async (data: CategoryFormValues) => {
    addNewCategory({
      ...data,
    });
    setIsAddDialogOpen(false);
  };

  // Handle editing a category
  const handleEditCategory = (data: CategoryFormValues) => {
    if (!currentCategory) return;

    updateExistingCategory({ ...currentCategory, ...data });
    setIsEditDialogOpen(false);
    setCurrentCategory(null);
  };

  // Handle deleting a category
  const handleDeleteCategory = () => {
    if (!currentCategory) return;

    removeCategory(currentCategory.id);
    setIsDeleteDialogOpen(false);
    setCurrentCategory(null);
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="space-y-4 overflow-hidden min-w-0">
      <div className="flex flex-col sm:flex-row gap-4 justify-between min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("categories.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Link href="/products">
            <Button variant="outline" className="gap-2">
              <Package className="h-4 w-4" />
              {t("categories.viewAllProducts")}
            </Button>
          </Link>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("categories.addCategory")}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{t("categories.title")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden min-w-0">
          <CategoryTable
            categories={filteredCategories}
            searchQuery={searchQuery}
            getProductCount={getProductCount}
            onEdit={(category) => {
              setCurrentCategory(category);
              setIsEditDialogOpen(true);
            }}
            onDelete={(category) => {
              setCurrentCategory(category);
              setIsDeleteDialogOpen(true);
            }}
            itemVariants={itemVariants}
          />
        </CardContent>
      </Card>

      <AddCategoryDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAddCategory}
      />

      <EditCategoryDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setCurrentCategory(null);
        }}
        category={currentCategory}
        onSubmit={handleEditCategory}
      />

      <DeleteCategoryDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setCurrentCategory(null);
        }}
        category={currentCategory}
        productCount={currentCategory ? getProductCount(currentCategory.id) : 0}
        onConfirm={handleDeleteCategory}
      />
    </div>
  );
}
