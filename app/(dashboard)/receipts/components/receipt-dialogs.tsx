"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { type Sale } from "@/components/pos-data-provider";
import type { Discount } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function EditReceiptDialog({
  sale,
  onClose,
  onSave,
  onSaveCustomerProfile,
  availableDiscounts = [],
}: {
  sale: Sale | null;
  onClose: () => void;
  onSave: (saleId: string, updates: Partial<Sale>) => Promise<void>;
  onSaveCustomerProfile?: (details: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  }) => Promise<void>;
  availableDiscounts?: Discount[];
}) {
  const { t } = useLanguage();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [discountId, setDiscountId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  useEffect(() => {
    if (sale) {
      setCustomerName(sale.customerName || "");
      setCustomerEmail(sale.customerEmail || "");
      setCustomerPhone(sale.customerPhone || "");
      setCustomerLocation(sale.customerLocation || "");
      setPaymentMethod(sale.paymentMethod || "cash");
      setNotes(sale.notes || "");
      setDiscountId(sale.discountId || undefined);
    }
  }, [sale]);

  const handleSave = async () => {
    if (!sale) return;
    try {
      setIsSaving(true);
      const updates = {
        customerName: customerName.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerLocation: customerLocation.trim() || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
        discountId,
      };
      await onSave(sale.id, updates);
      if (onSaveCustomerProfile) {
        setIsCreatingProfile(true);
        await onSaveCustomerProfile({
          name: updates.customerName,
          email: updates.customerEmail,
          phone: updates.customerPhone,
          location: updates.customerLocation,
        });
      }
    } finally {
      setIsCreatingProfile(false);
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={!!sale} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("receipts.editReceipt")}</DialogTitle>
          <DialogDescription>
            {t("receipts.editReceiptDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("receipts.customerName")}</Label>
            <Input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("receipts.email")}</Label>
              <Input
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("receipts.phone")}</Label>
              <Input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("receipts.location")}</Label>
            <Input
              value={customerLocation}
              onChange={(event) => setCustomerLocation(event.target.value)}
              placeholder={t("receipts.addressCity")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("receipts.paymentMethod")}</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t("reports.cash")}</SelectItem>
                <SelectItem value="credit">{t("reports.creditCard")}</SelectItem>
                <SelectItem value="mobile">{t("reports.mobilePayment")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("receipts.discount")}</Label>
            <Select
              value={discountId ?? "none"}
              onValueChange={(value) =>
                setDiscountId(value === "none" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("receipts.noDiscount")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("receipts.noDiscount")}</SelectItem>
                {availableDiscounts.length === 0 ? (
                  <SelectItem value="placeholder" disabled>
                    {t("receipts.noSavedDiscountsYet")}
                  </SelectItem>
                ) : (
                  availableDiscounts.map((discount) => (
                    <SelectItem key={discount.id} value={discount.id}>
                      {discount.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("customers.notes")}</Label>
            <Textarea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? t("common.saving") : t("common.saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VoidReceiptDialog({
  sale,
  onClose,
  onConfirm,
}: {
  sale: Sale | null;
  onClose: () => void;
  onConfirm: (saleId: string, reason?: string) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);

  useEffect(() => {
    setReason("");
  }, [sale]);

  const handleConfirm = async () => {
    if (!sale) return;
    try {
      setIsVoiding(true);
      await onConfirm(sale.id, reason.trim() || undefined);
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <Dialog open={!!sale} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("receipts.voidReceipt")}</DialogTitle>
          <DialogDescription>
            {t("receipts.voidReceiptDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Label>{t("receipts.reasonForVoid")}</Label>
          <Textarea
            rows={3}
            placeholder={t("receipts.reasonPlaceholder")}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isVoiding}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isVoiding}
          >
            {isVoiding ? t("receipts.voiding") : t("receipts.confirmVoid")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteReceiptDialog({
  sale,
  onClose,
  onConfirm,
}: {
  sale: Sale | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const { t } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!sale) return;
    try {
      setIsDeleting(true);
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={!!sale} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("receipts.deleteReceiptConfirm")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("receipts.deleteReceiptDesc")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? t("receipts.deleting") : t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
