"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { type CartItem as CartItemType, type Worker } from "@/components/pos-data-provider";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SwitchRow } from "@/components/ui/switch-row";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package, Plus, Minus, Pencil, Trash2, Tag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatMeasurementValue,
  getProductUnitPrice,
  getProductUnitPriceForVariation,
  getSaleType,
  getUnitIncrement,
  getUnitLabel,
} from "@/lib/product-measurements";

interface CartItemProps {
  item: CartItemType;
  currencySymbol: string;
  onUpdateQuantity: (lineId: string, quantity: number) => void;
  onToggleRentalMode?: (lineId: string, isRental: boolean) => void;
  onUpdateRentalDates: (
    lineId: string,
    rentalDates: { rentalStartDate?: string; rentalEndDate?: string }
  ) => void;
  onRemove: (lineId: string) => void;
  onUpdateCustomLine?: (
    lineId: string,
    updates: {
      name: string;
      price: number;
      quantity: number;
      workerId?: string;
      workerName?: string;
      serviceType?: string;
      notes?: string;
      taxable?: boolean;
    }
  ) => void;
  workers?: Worker[];
  variants?: any;
}

export function CartItem({
  item,
  currencySymbol,
  onUpdateQuantity,
  onToggleRentalMode,
  onUpdateRentalDates,
  onRemove,
  onUpdateCustomLine,
  workers = [],
  variants,
}: CartItemProps) {
  const { t } = useLanguage();
  const isCustom = Boolean(item.customLine);
  const baseSaleType = getSaleType(item.product);
  const saleType =
    item.isRental === true
      ? "rental"
      : baseSaleType === "rental"
      ? "item"
      : baseSaleType;
  const unitLabel = getUnitLabel(item.product);
  const variation = item.variationId
    ? item.product.variations?.find((entry) => entry.id === item.variationId)
    : undefined;
  const unitPrice =
    typeof item.unitPrice === "number"
      ? item.unitPrice
      : variation
        ? getProductUnitPriceForVariation(item.product, variation, item.isRental)
        : getProductUnitPrice(item.product, item.isRental);
  const quantityStep = getUnitIncrement(item.product);
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
  const hasSellPrice = variation
    ? getProductUnitPriceForVariation(item.product, variation, false) > 0
    : getProductUnitPrice(item.product, false) > 0;
  const hasRentalPrice = variation
    ? getProductUnitPriceForVariation(item.product, variation, true) > 0
    : getProductUnitPrice(item.product, true) > 0;
  const canChooseSellOrRent =
    !isCustom && hasSellPrice && hasRentalPrice && Boolean(onToggleRentalMode);
  const canIncrease =
    maxStock > 0 && item.quantity + quantityStep <= maxStock + 0.0001;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editQuantity, setEditQuantity] = useState(String(item.quantity));
  const [editStartDate, setEditStartDate] = useState(item.rentalStartDate || "");
  const [editEndDate, setEditEndDate] = useState(item.rentalEndDate || "");
  const [editName, setEditName] = useState(
    item.customLine?.name || item.product.name
  );
  const [editPrice, setEditPrice] = useState(String(unitPrice));
  const [editServiceType, setEditServiceType] = useState(
    item.customLine?.serviceType || ""
  );
  const [editNotes, setEditNotes] = useState(item.customLine?.notes || "");
  const [editTaxable, setEditTaxable] = useState(
    item.customLine?.taxable ?? false
  );
  const [editWorkerId, setEditWorkerId] = useState(
    item.customLine?.workerId || ""
  );
  const [editWorkerName, setEditWorkerName] = useState(
    item.customLine?.workerName || ""
  );

  useEffect(() => {
    setEditQuantity(String(item.quantity));
    setEditStartDate(item.rentalStartDate || "");
    setEditEndDate(item.rentalEndDate || "");
    setEditName(item.customLine?.name || item.product.name);
    setEditPrice(String(unitPrice));
    setEditServiceType(item.customLine?.serviceType || "");
    setEditNotes(item.customLine?.notes || "");
    setEditTaxable(item.customLine?.taxable ?? false);
    setEditWorkerId(item.customLine?.workerId || "");
    setEditWorkerName(item.customLine?.workerName || "");
  }, [
    item.id,
    item.quantity,
    item.rentalStartDate,
    item.rentalEndDate,
    item.customLine?.name,
    item.customLine?.serviceType,
    item.customLine?.notes,
    item.customLine?.taxable,
    item.customLine?.workerId,
    item.customLine?.workerName,
    item.product.name,
    unitPrice,
  ]);

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
    if (isCustom && onUpdateCustomLine) {
      const parsedPrice = parseFloat(editPrice);
      if (!Number.isNaN(parsedPrice) && parsedPrice >= 0) {
        const workerName =
          workers.find((worker) => worker.id === editWorkerId)?.name ||
          editWorkerName ||
          undefined;
        onUpdateCustomLine(item.id, {
          name: editName.trim() || item.product.name,
          price: parsedPrice,
          quantity: Number.isNaN(parsedQty) || parsedQty <= 0 ? item.quantity : parsedQty,
          workerId: editWorkerId || undefined,
          workerName,
          serviceType: editServiceType.trim() || undefined,
          notes: editNotes.trim() || undefined,
          taxable: editTaxable,
        });
      }
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
        {isCustom ? (
          <div className="h-full w-full flex items-center justify-center">
            <Tag className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : item.product.image ? (
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
              {isCustom ? editName || item.product.name : item.product.name}
            </h3>
            {item.variationName && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {item.variationName}
              </span>
            )}
            {isCustom && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/30 text-slate-600">
                {t("sales.customLabel")}
              </span>
            )}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {quantityDisplay}
            </span>
          </div>
          {isCustom && (
            <div className="text-[11px] text-muted-foreground">
              {item.customLine?.serviceType && (
                <span>{item.customLine.serviceType}</span>
              )}
              {item.customLine?.workerName && (
                <span>
                  {item.customLine?.serviceType ? " • " : ""}
                  {item.customLine.workerName}
                </span>
              )}
            </div>
          )}
          {canChooseSellOrRent && (
            <div className="mb-1.5 flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={item.isRental ? "outline" : "default"}
                className="h-6 px-2 text-[11px]"
                onClick={() => onToggleRentalMode?.(item.id, false)}
              >
                {t("checkout.sell")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={item.isRental ? "default" : "outline"}
                className="h-6 px-2 text-[11px]"
                onClick={() => onToggleRentalMode?.(item.id, true)}
              >
                {t("checkout.rent")}
              </Button>
            </div>
          )}
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
            <DialogTitle>{t("sales.editCartItem")}</DialogTitle>
            <DialogDescription>
              {isCustom
                ? t("sales.updateCustomLineDesc")
                : t("sales.updateQuantityRentalDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("sales.itemLabel")}</Label>
              <p className="text-sm font-medium">
                {isCustom ? editName || item.product.name : item.product.name}
                {item.variationName ? ` (${item.variationName})` : ""}
              </p>
            </div>
            {isCustom && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>{t("checkout.customItemName")}</Label>
                  <Input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("sales.price")}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPrice}
                    onChange={(event) => setEditPrice(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("checkout.serviceType")}</Label>
                  <Input
                    value={editServiceType}
                    onChange={(event) => setEditServiceType(event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>{t("checkout.worker")}</Label>
                  {workers.length > 0 ? (
                    <Select
                      value={editWorkerId || "__none__"}
                      onValueChange={(value) =>
                        setEditWorkerId(value === "__none__" ? "" : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("sales.selectWorker")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">{t("sales.none")}</SelectItem>
                        {workers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            {worker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder={t("sales.workerNamePlaceholder")}
                      value={editWorkerName}
                      onChange={(event) => setEditWorkerName(event.target.value)}
                    />
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>{t("cart.notes")}</Label>
                  <textarea
                    className="w-full rounded-[14px] border border-white/30 bg-white/20 px-3 py-2 text-sm text-slate-700 backdrop-blur-[16px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                    rows={3}
                    value={editNotes}
                    onChange={(event) => setEditNotes(event.target.value)}
                  />
                </div>
                <SwitchRow className="rounded-[14px] border border-white/30 bg-white/20 px-3 py-2 md:col-span-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{t("sales.taxable")}</p>
                    <p className="text-xs text-slate-500">
                      {t("sales.taxableDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={editTaxable}
                    onCheckedChange={setEditTaxable}
                  />
                </SwitchRow>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("checkout.qty")} ({unitLabel})</Label>
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
                  <Label>{t("checkout.rentalStart")}</Label>
                  <Input
                    type="datetime-local"
                    value={editStartDate}
                    onChange={(event) => setEditStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("checkout.rentalEnd")}</Label>
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
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveEdit}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
