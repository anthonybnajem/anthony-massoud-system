"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type Product,
  type StockMovement,
} from "@/components/pos-data-provider";
import { useToast } from "@/components/ui/use-toast";
import {
  formatMeasurementValue,
  formatStockDisplay,
  getUnitIncrement,
  getUnitLabel,
} from "@/lib/product-measurements";

interface StockAdjustmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onAdjust: (
    productId: string,
    quantity: number,
    type: StockMovement["type"],
    reason?: string,
    notes?: string
  ) => Promise<void>;
}

const ADJUSTMENT_REASONS = [
  { value: "Restock", key: "inventory.restock" as const },
  { value: "Damage", key: "inventory.damage" as const },
  { value: "Return", key: "inventory.return" as const },
  { value: "Theft", key: "inventory.theft" as const },
  { value: "Expired", key: "inventory.expired" as const },
  { value: "Count Correction", key: "inventory.countCorrection" as const },
  { value: "Other", key: "inventory.other" as const },
];

export function StockAdjustmentDialog({
  isOpen,
  onOpenChange,
  product,
  onAdjust,
}: StockAdjustmentDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [adjustmentType, setAdjustmentType] = useState<
    "add" | "remove" | "set"
  >("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!product) return null;

  const unitLabel = getUnitLabel(product);
  const unitIncrement = getUnitIncrement(product);
  const formattedCurrentStock = formatStockDisplay(product);

  const handleSubmit = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      toast({
        title: t("inventory.invalidQuantity"),
        description: t("inventory.invalidQuantityMessage"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let finalQuantity: number;
      let movementType: StockMovement["type"] = "adjustment";

      if (adjustmentType === "set") {
        finalQuantity = parseFloat(quantity) - product.stock;
      } else if (adjustmentType === "add") {
        finalQuantity = parseFloat(quantity);
      } else {
        finalQuantity = -parseFloat(quantity);
      }

      await onAdjust(product.id, finalQuantity, movementType, reason, notes);

      // Reset form
      setQuantity("");
      setReason("");
      setNotes("");
      setAdjustmentType("add");
      onOpenChange(false);
    } catch (error) {
      console.error("Error adjusting stock:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateNewStock = () => {
    if (!quantity || parseFloat(quantity) <= 0) return product.stock;

    const qty = parseFloat(quantity);
    if (adjustmentType === "set") {
      return qty;
    } else if (adjustmentType === "add") {
      return product.stock + qty;
    } else {
      return Math.max(0, product.stock - qty);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("inventory.adjustStock")}</DialogTitle>
          <DialogDescription>
            {t("inventory.adjustStockDesc", { name: product.name })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("products.product")}</Label>
            <Input value={product.name} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>{t("inventory.currentStock")}</Label>
            <Input
              value={formattedCurrentStock}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("inventory.adjustmentType")}</Label>
            <Select
              value={adjustmentType}
              onValueChange={(value) =>
                setAdjustmentType(value as "add" | "remove" | "set")
              }
            >
              <SelectTrigger className="border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">{t("inventory.addStock")}</SelectItem>
                <SelectItem value="remove">{t("inventory.removeStock")}</SelectItem>
                <SelectItem value="set">{t("inventory.setStock")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {t("inventory.quantity")} ({unitLabel}){" "}
              {adjustmentType === "set" ? `(${t("inventory.newStockLevel")})` : ""}
            </Label>
            <Input
              type="number"
              min="0"
              step={unitIncrement}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={t("inventory.enterQuantity")}
              className="border-2 focus:border-primary"
            />
          </div>

          {quantity && parseFloat(quantity) > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="text-sm text-muted-foreground">
                {t("inventory.newStockLevel")}:
              </div>
              <div className="text-lg font-semibold">
                {formatMeasurementValue(calculateNewStock())} {unitLabel}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("inventory.reason")}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="border-2">
                <SelectValue placeholder={t("inventory.selectReason")} />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {t(r.key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("inventory.notes")}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("inventory.notesPlaceholder")}
              className="border-2 focus:border-primary min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setQuantity("");
              setReason("");
              setNotes("");
              setAdjustmentType("add");
            }}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t("inventory.adjusting") : t("inventory.adjustStock")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
