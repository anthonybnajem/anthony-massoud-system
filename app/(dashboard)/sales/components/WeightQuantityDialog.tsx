"use client";

import { useEffect, useState } from "react";
import { type Product } from "@/components/pos-data-provider";
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
import {
  formatMeasurementValue,
  formatStockDisplay,
  getProductUnitPrice,
  getUnitIncrement,
  getUnitLabel,
} from "@/lib/product-measurements";

interface WeightQuantityDialogProps {
  product: Product | null;
  isOpen: boolean;
  currencySymbol: string;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}

export function WeightQuantityDialog({
  product,
  isOpen,
  currencySymbol,
  onClose,
  onConfirm,
}: WeightQuantityDialogProps) {
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState("");
  const unitLabel = getUnitLabel(product ?? undefined);
  const unitIncrement = getUnitIncrement(product ?? undefined);
  const sellPrice = getProductUnitPrice(product ?? undefined, false);
  const rentPrice = getProductUnitPrice(product ?? undefined, true);
  const isRentalOnly = rentPrice > 0 && sellPrice <= 0;
  const unitPrice = sellPrice > 0 ? sellPrice : rentPrice;
  const availableStock = product?.stock ?? 0;

  useEffect(() => {
    if (product && product.stock > 0) {
      const defaultQuantity = Math.min(product.stock, unitIncrement);
      setQuantity(formatMeasurementValue(defaultQuantity));
    } else {
      setQuantity("");
    }
  }, [product, unitIncrement]);

  const parsedQuantity = parseFloat(quantity);
  const isQuantityValid =
    !!product &&
    product.stock > 0 &&
    !Number.isNaN(parsedQuantity) &&
    parsedQuantity > 0 &&
    parsedQuantity <= product.stock + 0.0001;

  const handleConfirm = () => {
    if (!product || !isQuantityValid) return;
    onConfirm(Math.min(parsedQuantity, product.stock));
  };

  return (
    <Dialog
      open={isOpen && Boolean(product)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("sales.enterWeight")}</DialogTitle>
          <DialogDescription>
            {t("sales.enterWeightDesc")
              .replace("{unit}", unitLabel)
              .replace("{name}", product?.name ?? "")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t("sales.price")}</p>
              {isRentalOnly ? (
                <div className="space-y-0.5 font-semibold">
                  <p>
                    {t("checkout.rent")}: {currencySymbol}
                    {unitPrice.toFixed(2)} / {unitLabel}
                  </p>
                  <p className="text-muted-foreground font-normal">
                    {t("sales.saleLabel")}: —
                  </p>
                </div>
              ) : (
                <p className="font-semibold">
                  {currencySymbol}
                  {unitPrice.toFixed(2)} / {unitLabel}
                </p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">{t("sales.available")}</p>
              <p className="font-semibold">
                {formatStockDisplay(product ?? undefined)}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("sales.quantityWithUnit").replace("{unit}", unitLabel)}
            </label>
            <Input
              type="number"
              min="0"
              step={unitIncrement}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={!product || availableStock <= 0}
            />
            <p className="text-xs text-muted-foreground">
              {t("sales.minimumStepDesc")
                .replace("{value}", formatMeasurementValue(unitIncrement))
                .replace("{unit}", unitLabel)}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={!isQuantityValid}>
            {t("sales.addToCart")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
