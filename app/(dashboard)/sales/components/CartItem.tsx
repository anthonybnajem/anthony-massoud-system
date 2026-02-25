"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { type CartItem as CartItemType } from "@/components/pos-data-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package, Plus, Minus, Pencil, Trash2 } from "lucide-react";
import {
  formatMeasurementValue,
  getProductUnitPrice,
  getSaleType,
  getUnitIncrement,
  getUnitLabel,
} from "@/lib/product-measurements";

interface CartItemProps {
  item: CartItemType;
  currencySymbol: string;
  onUpdateQuantity: (lineId: string, quantity: number) => void;
  onToggleRentalMode: (lineId: string, isRental: boolean) => void;
  onUpdateRentalDates: (
    lineId: string,
    rentalDates: { rentalStartDate?: string; rentalEndDate?: string }
  ) => void;
  onRemove: (lineId: string) => void;
  variants?: any;
}

export function CartItem({
  item,
  currencySymbol,
  onUpdateQuantity,
  onToggleRentalMode,
  onUpdateRentalDates,
  onRemove,
  variants,
}: CartItemProps) {
  const baseSaleType = getSaleType(item.product);
  const saleType =
    item.isRental === true
      ? "rental"
      : baseSaleType === "rental"
      ? "item"
      : baseSaleType;
  const unitLabel = getUnitLabel(item.product);
  const unitPrice =
    typeof item.unitPrice === "number"
      ? item.unitPrice
      : getProductUnitPrice(item.product);
  const quantityStep = getUnitIncrement(item.product);
  const variation = item.variationId
    ? item.product.variations?.find((entry) => entry.id === item.variationId)
    : undefined;
  const maxStock = Math.min(
    item.product.stock,
    variation?.stock ?? item.product.stock
  );
  const quantityDisplay =
    saleType === "weight"
      ? `${formatMeasurementValue(item.quantity)} ${unitLabel}`
      : saleType === "rental"
      ? `${formatMeasurementValue(item.quantity)} ${unitLabel}`
      : `×${formatMeasurementValue(item.quantity)}`;
  const canRent =
    typeof variation?.rentalPrice === "number" ||
    typeof item.product.rentalPrice === "number";
  const canIncrease =
    maxStock > 0 && item.quantity + quantityStep <= maxStock + 0.0001;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editQuantity, setEditQuantity] = useState(String(item.quantity));
  const [editStartDate, setEditStartDate] = useState(item.rentalStartDate || "");
  const [editEndDate, setEditEndDate] = useState(item.rentalEndDate || "");

  useEffect(() => {
    setEditQuantity(String(item.quantity));
    setEditStartDate(item.rentalStartDate || "");
    setEditEndDate(item.rentalEndDate || "");
  }, [item.id, item.quantity, item.rentalStartDate, item.rentalEndDate]);

  const handleDecrease = () => {
    const nextQuantity = parseFloat(
      (item.quantity - quantityStep).toFixed(3)
    );
    onUpdateQuantity(item.id, Math.max(0, nextQuantity));
  };

  const handleIncrease = () => {
    const nextQuantity = parseFloat(
      (item.quantity + quantityStep).toFixed(3)
    );
    onUpdateQuantity(item.id, nextQuantity);
  };

  const handleSaveEdit = () => {
    const parsedQty = parseFloat(editQuantity);
    if (!Number.isNaN(parsedQty) && parsedQty > 0) {
      onUpdateQuantity(item.id, parsedQty);
    }
    if (item.isRental) {
      onUpdateRentalDates(item.id, {
        rentalStartDate: editStartDate,
        rentalEndDate: editEndDate,
      });
    }
    setIsEditOpen(false);
  };

  return (
    <motion.div
      key={item.id}
      layout
      variants={variants}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className="flex items-center gap-2.5 p-2.5 hover:bg-muted/50 active:bg-muted transition-colors group touch-manipulation"
    >
      <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0 overflow-hidden border border-border">
        {item.product.image ? (
          <img
            src={item.product.image || "/placeholder.svg"}
            alt={item.product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm leading-tight truncate">
              {item.product.name}
            </h3>
            {item.variationName && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {item.variationName}
              </span>
            )}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {quantityDisplay}
            </span>
          </div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={item.isRental ? "outline" : "default"}
              className="h-6 px-2 text-[11px]"
              onClick={() => onToggleRentalMode(item.id, false)}
            >
              Sell
            </Button>
            <Button
              type="button"
              size="sm"
              variant={item.isRental ? "default" : "outline"}
              className="h-6 px-2 text-[11px]"
              disabled={!canRent}
              onClick={() => onToggleRentalMode(item.id, true)}
            >
              Rent
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {currencySymbol}
              {unitPrice.toFixed(2)}
            </p>
            <span className="text-muted-foreground">•</span>
            <p className="text-sm font-semibold text-foreground">
              {currencySymbol}
              {(unitPrice * item.quantity).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-md touch-manipulation active:scale-95"
            onClick={handleDecrease}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-md touch-manipulation active:scale-95"
            onClick={handleIncrease}
            disabled={!canIncrease}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-foreground touch-manipulation"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-destructive opacity-70 group-hover:opacity-100 transition-opacity touch-manipulation"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Cart Item</DialogTitle>
            <DialogDescription>
              Update quantity and rental details for this line.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Item</Label>
              <p className="text-sm font-medium">
                {item.product.name}
                {item.variationName ? ` (${item.variationName})` : ""}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Quantity ({unitLabel})</Label>
              <Input
                type="number"
                min="0"
                step={quantityStep}
                value={editQuantity}
                onChange={(event) => setEditQuantity(event.target.value)}
              />
            </div>
            {item.isRental && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Rental Start</Label>
                  <Input
                    type="datetime-local"
                    value={editStartDate}
                    onChange={(event) => setEditStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rental End</Label>
                  <Input
                    type="datetime-local"
                    value={editEndDate}
                    onChange={(event) => setEditEndDate(event.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
