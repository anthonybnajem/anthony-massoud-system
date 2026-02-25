"use client";

import { useEffect, useMemo, useState } from "react";
import { type Product } from "@/components/pos-data-provider";
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
  onConfirm: (variationId: string, quantity: number) => void;
}

export function VariationSelectionDialog({
  product,
  isOpen,
  currencySymbol,
  onClose,
  onConfirm,
}: VariationSelectionDialogProps) {
  const [selectedVariationId, setSelectedVariationId] = useState("");
  const [quantity, setQuantity] = useState("");

  const variations = product?.variations || [];
  const unitLabel = getUnitLabel(product ?? undefined);
  const unitIncrement = getUnitIncrement(product ?? undefined);
  const saleType = getSaleType(product ?? undefined);

  useEffect(() => {
    if (!product || variations.length === 0) {
      setSelectedVariationId("");
      setQuantity("");
      return;
    }
    const firstId = variations[0].id;
    setSelectedVariationId(firstId);
    const defaultQuantity = saleType === "weight" ? unitIncrement : 1;
    setQuantity(formatMeasurementValue(defaultQuantity));
  }, [product, saleType, unitIncrement, variations]);

  const selectedVariation = useMemo(
    () => variations.find((variation) => variation.id === selectedVariationId),
    [selectedVariationId, variations]
  );

  const parsedQuantity = parseFloat(quantity);
  const availableStock = Math.min(
    product?.stock ?? 0,
    selectedVariation?.stock ?? product?.stock ?? 0
  );
  const unitPrice = getProductUnitPriceForVariation(
    product ?? undefined,
    selectedVariation
  );

  const isQuantityValid =
    !!product &&
    !!selectedVariation &&
    availableStock > 0 &&
    !Number.isNaN(parsedQuantity) &&
    parsedQuantity > 0 &&
    parsedQuantity <= availableStock + 0.0001;

  const handleConfirm = () => {
    if (!selectedVariation || !isQuantityValid) return;
    onConfirm(selectedVariation.id, Math.min(parsedQuantity, availableStock));
  };

  return (
    <Dialog
      open={isOpen && Boolean(product) && variations.length > 0}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Variation</DialogTitle>
          <DialogDescription>
            Choose the size/specification for {product?.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Variation</label>
            <Select
              value={selectedVariationId}
              onValueChange={setSelectedVariationId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a variation" />
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

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Unit Price</p>
              <p className="font-semibold">
                {currencySymbol}
                {unitPrice.toFixed(2)} / {unitLabel}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Available</p>
              <p className="font-semibold">
                {formatMeasurementValue(availableStock)} {unitLabel}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Quantity ({unitLabel})
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
              Minimum step {formatMeasurementValue(unitIncrement)} {unitLabel}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isQuantityValid}>
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
