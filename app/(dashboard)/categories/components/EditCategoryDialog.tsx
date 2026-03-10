"use client";

import { useLanguage } from "@/components/language-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CategoryForm, type CategoryFormValues } from "./CategoryForm";
import { type Category } from "@/components/pos-data-provider";

interface EditCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSubmit: (data: CategoryFormValues) => void;
}

export function EditCategoryDialog({
  isOpen,
  onClose,
  category,
  onSubmit,
}: EditCategoryDialogProps) {
  const { t } = useLanguage();
  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("categories.editCategory")}</DialogTitle>
          <DialogDescription>{t("categories.editCategoryDesc")}</DialogDescription>
        </DialogHeader>
        <CategoryForm
          defaultValues={category}
          onSubmit={(data) => {
            onSubmit(data);
            onClose();
          }}
          onCancel={onClose}
          submitLabel={t("common.saveChanges")}
        />
      </DialogContent>
    </Dialog>
  );
}
