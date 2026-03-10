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

interface AddCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormValues) => void;
}

export function AddCategoryDialog({
  isOpen,
  onClose,
  onSubmit,
}: AddCategoryDialogProps) {
  const { t } = useLanguage();
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("categories.addNewCategory")}</DialogTitle>
          <DialogDescription>
            {t("categories.addNewCategoryDesc")}
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          onSubmit={(data) => {
            onSubmit(data);
            onClose();
          }}
          onCancel={onClose}
          submitLabel={t("categories.addCategory")}
        />
      </DialogContent>
    </Dialog>
  );
}
