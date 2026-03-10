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
import { type Employee } from "@/components/pos-data-provider";

interface DeleteEmployeeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onDelete: () => void;
}

export function DeleteEmployeeDialog({
  isOpen,
  onOpenChange,
  employee,
  onDelete,
}: DeleteEmployeeDialogProps) {
  const { t } = useLanguage();
  if (!employee) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("employees.deleteConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("employees.deleteConfirmDesc", { name: employee.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
