"use client";

import { useEffect, useMemo, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatMeasurementValue,
  getProductUnitPriceForVariation,
  getSaleType,
  getUnitIncrement,
  getUnitLabel,
} from "@/lib/product-measurements";

interface VariationSelectionDialogProps {
  product: Product | null;
  isOpen: boolean;
  currencySymbol: string;
  onClose: () => void;
  /** variationId, quantity, and whether the item is for rent (vs sale). */
  onConfirm: (variationId: string, quantity: number, isRental: boolean) => void;
}

export function VariationSelectionDialog({
  product,
  isOpen,
  currencySymbol,
  onClose,
  onConfirm,
}: VariationSelectionDialogProps) {
  const { t } = useLanguage();
  const [selectedVariationId, setSelectedVariationId] = useState("");
  const [quantity, setQuantity] = useState("");
  /** When saleType is item_and_rental, user chooses Rent or Sale. */
  const [rentOrSale, setRentOrSale] = useState<"rent" | "sale">("sale");

  const variations = product?.variations || [];
  const unitLabel = getUnitLabel(product ?? undefined);
  const unitIncrement = getUnitIncrement(product ?? undefined);
  const saleType = getSaleType(product ?? undefined);

  const selectedVariationForPrice = useMemo(
    () =>
      variations.find((v) => v.id === selectedVariationId) ?? variations[0] ?? null,
    [variations, selectedVariationId]
  );
  const hasSellPrice =
    getProductUnitPriceForVariation(
      product ?? undefined,
      variations.length > 0 ? selectedVariationForPrice : null,
      false
    ) > 0;
  const hasRentalPrice =
    getProductUnitPriceForVariation(
      product ?? undefined,
      variations.length > 0 ? selectedVariationForPrice : null,
      true
    ) > 0;
  const canChooseRentOrSale =
    saleType === "item_and_rental" || (hasSellPrice && hasRentalPrice);

  useEffect(() => {
    if (!product) {
      setSelectedVariationId("");
      setQuantity("");
      return;
    }
    if (variations.length > 0) {
      const firstId = variations[0].id;
      setSelectedVariationId(firstId);
    } else {
      setSelectedVariationId("");
    }
    const defaultQuantity = saleType === "weight" ? unitIncrement : 1;
    setQuantity(formatMeasurementValue(defaultQuantity));
  }, [product, saleType, unitIncrement, variations]);

  const selectedVariation = useMemo(
    () => variations.find((variation) => variation.id === selectedVariationId),
    [selectedVariationId, variations]
  );

  const hasVariations = variations.length > 0;
  const parsedQuantity = parseFloat(quantity);
  const availableStock = hasVariations
    ? Math.min(
        product?.stock ?? 0,
        selectedVariation?.stock ?? product?.stock ?? 0
      )
    : (product?.stock ?? 0);
  const isRentalOnly = hasRentalPrice && !hasSellPrice;
  const isRental =
    canChooseRentOrSale
      ? rentOrSale === "rent"
      : saleType === "rental" || isRentalOnly;
  const unitPrice = getProductUnitPriceForVariation(
    product ?? undefined,
    hasVariations ? selectedVariation : null,
    isRental
  );
  const sellPrice = getProductUnitPriceForVariation(
    product ?? undefined,
    hasVariations ? selectedVariation : null,
    false
  );
  const rentalPrice = getProductUnitPriceForVariation(
    product ?? undefined,
    hasVariations ? selectedVariation : null,
    true
  );

  const isQuantityValid =
    !!product &&
    (hasVariations ? !!selectedVariation : true) &&
    availableStock > 0 &&
    !Number.isNaN(parsedQuantity) &&
    parsedQuantity > 0 &&
    parsedQuantity <= availableStock + 0.0001;

  const handleConfirm = () => {
    if (!product || !isQuantityValid) return;
    const qty = Math.min(parsedQuantity, availableStock);
    if (hasVariations && selectedVariation) {
      onConfirm(selectedVariation.id, qty, isRental);
    } else {
      onConfirm("", qty, isRental);
    }
  };

  return (
    <Dialog
      open={isOpen && Boolean(product)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("sales.selectVariation")}</DialogTitle>
          <DialogDescription>
            {t("sales.selectVariationDesc").replace("{name}", product?.name ?? "")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {hasVariations && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("sales.variation")}</label>
              <Select
                value={selectedVariationId}
                onValueChange={setSelectedVariationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("sales.selectVariation")} />
                </SelectTrigger>
                <SelectContent>
                  {variations.map((variation) => (
                    <SelectItem key={variation.id} value={variation.id}>
                      {variation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {canChooseRentOrSale && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("sales.rentOrSale")}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="rentOrSale"
                    checked={rentOrSale === "rent"}
                    onChange={() => setRentOrSale("rent")}
                    className="h-4 w-4"
                  />
                  <span>{t("checkout.rent")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="rentOrSale"
                    checked={rentOrSale === "sale"}
                    onChange={() => setRentOrSale("sale")}
                    className="h-4 w-4"
                  />
                  <span>{t("sales.saleLabel")}</span>
                </label>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t("checkout.unitPrice")}</p>
              {canChooseRentOrSale ? (
                <div className="space-y-0.5 font-semibold">
                  <p>
                    {t("sales.saleLabel")}: {currencySymbol}
                    {sellPrice.toFixed(2)} / {unitLabel}
                  </p>
                  <p>
                    {t("checkout.rent")}: {currencySymbol}
                    {rentalPrice.toFixed(2)} / {unitLabel}
                  </p>
                </div>
              ) : isRentalOnly ? (
                <div className="space-y-0.5 font-semibold">
                  <p>
                    {t("checkout.rent")}: {currencySymbol}
                    {rentalPrice.toFixed(2)} / {unitLabel}
                  </p>
                  <p className="text-muted-foreground">
                    {t("sales.saleLabel")}: —
                  </p>
                </div>
              ) : hasSellPrice && !hasRentalPrice ? (
                <div className="space-y-0.5 font-semibold">
                  <p>
                    {t("sales.saleLabel")}: {currencySymbol}
                    {sellPrice.toFixed(2)} / {unitLabel}
                  </p>
                  <p className="text-muted-foreground">
                    {t("checkout.rent")}: —
                  </p>
                </div>
              ) : (
                <p className="font-semibold">
                  {isRental
                    ? `${t("checkout.rent")}: `
                    : `${t("sales.saleLabel")}: `}
                  {currencySymbol}
                  {unitPrice.toFixed(2)} / {unitLabel}
                </p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">{t("sales.available")}</p>
              <p className="font-semibold">
                {formatMeasurementValue(availableStock)} {unitLabel}
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
