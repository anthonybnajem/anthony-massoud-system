"use client";

import { useLanguage } from "@/components/language-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type Category } from "@/components/pos-data-provider";

interface DeleteCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  productCount: number;
  onConfirm: () => void;
}

export function DeleteCategoryDialog({
  isOpen,
  onClose,
  category,
  productCount,
  onConfirm,
}: DeleteCategoryDialogProps) {
  const { t } = useLanguage();
  if (!category) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("categories.deleteCategoryConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("categories.deleteCategoryConfirmDesc")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <p className="font-medium">{category.name}</p>
          {category.description && (
            <p className="text-sm text-muted-foreground">
              {category.description}
            </p>
          )}
          <p className="mt-2 text-sm">
            {t("categories.deleteCategoryProductCount", { count: productCount })}
          </p>
          {productCount > 0 && (
            <p className="mt-2 text-sm text-destructive">
              {t("categories.deleteCategoryReassign")}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={productCount > 0}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
