import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { User, Mail, Phone, Pencil, ReceiptText, Trash2 } from "lucide-react";
import type { Worker } from "@/components/pos-data-provider";

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  setIsCustomerDialogOpen: (isOpen: boolean) => void;
  hasRentalItems?: boolean;
  rentalStartDate?: string;
  rentalEndDate?: string;
  setRentalStartDate?: (value: string) => void;
  setRentalEndDate?: (value: string) => void;
  onApplyRentalDatesToAll?: () => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  cartSubtotal: number;
  discountValue: number;
  discountType: "percentage" | "fixed";
  discountAmount: number;
  discountLabel?: string;
  taxRate: number;
  taxAmount: number;
  cartTotal: number;
  receiptItems: Array<{
    id: string;
    name: string;
    variationName?: string;
    quantity: number;
    unitLabel?: string;
    stock?: number;
    unitPrice: number;
    lineTotal: number;
    isRental: boolean;
    rentalStartDate?: string;
    rentalEndDate?: string;
    isCustom?: boolean;
    customLine?: {
      name: string;
      price: number;
      source?: "custom" | "worker" | "service";
      workerId?: string;
      workerName?: string;
      serviceType?: string;
      notes?: string;
      taxable?: boolean;
    };
    taxable?: boolean;
  }>;
  onReceiptItemRentalDatesChange?: (
    lineId: string,
    dates: { rentalStartDate?: string; rentalEndDate?: string }
  ) => void;
  onReceiptItemQuantityChange?: (lineId: string, quantity: number) => void;
  onReceiptItemModeChange?: (lineId: string, isRental: boolean) => void;
  onReceiptItemCustomUpdate?: (
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
      unitLabel?: string;
    }
  ) => void;
  onReceiptItemRemove?: (lineId: string) => void;
  onAddCustomLine?: () => void;
  workers?: Worker[];
  currencySymbol: string;
  handleCheckout: () => void;
}

export default function CheckoutDialog({
  isOpen,
  onClose,
  customerName,
  customerEmail,
  customerPhone,
  setIsCustomerDialogOpen,
  hasRentalItems = false,
  rentalStartDate = "",
  rentalEndDate = "",
  setRentalStartDate,
  setRentalEndDate,
  onApplyRentalDatesToAll,
  paymentMethod,
  setPaymentMethod,
  cartSubtotal,
  discountValue,
  discountType,
  discountAmount,
  discountLabel,
  taxRate,
  taxAmount,
  cartTotal,
  receiptItems,
  onReceiptItemRentalDatesChange,
  onReceiptItemQuantityChange,
  onReceiptItemModeChange,
  onReceiptItemCustomUpdate,
  onReceiptItemRemove,
  onAddCustomLine,
  workers = [],
  currencySymbol,
  handleCheckout,
}: CheckoutDialogProps) {
  const [autoApplyRentalDates, setAutoApplyRentalDates] = useState(false);
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!hasRentalItems && autoApplyRentalDates) {
      setAutoApplyRentalDates(false);
    }
  }, [hasRentalItems, autoApplyRentalDates]);

  useEffect(() => {
    if (!autoApplyRentalDates) return;
    onApplyRentalDatesToAll?.();
  }, [
    autoApplyRentalDates,
    rentalStartDate,
    rentalEndDate,
    onApplyRentalDatesToAll,
  ]);

  const formatShortDate = (value?: string) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return format(parsed, "MM/dd/yyyy");
  };

  useEffect(() => {
    if (isOpen) return;
    setEditingRows({});
  }, [isOpen]);

  const resolveWorkerName = (workerId?: string, fallback?: string) => {
    if (!workerId) return fallback;
    return workers.find((worker) => worker.id === workerId)?.name || fallback;
  };

  const getCustomDefaults = (item: CheckoutDialogProps["receiptItems"][number]) => ({
    name: item.customLine?.name || item.name,
    price: item.customLine?.price ?? item.unitPrice,
    quantity: item.quantity,
    workerId: item.customLine?.workerId,
    workerName: item.customLine?.workerName,
    serviceType: item.customLine?.serviceType,
    notes: item.customLine?.notes,
    taxable: item.customLine?.taxable ?? item.taxable ?? false,
    unitLabel: item.unitLabel,
  });

  const handleCustomUpdate = (
    item: CheckoutDialogProps["receiptItems"][number],
    overrides: Partial<ReturnType<typeof getCustomDefaults>>
  ) => {
    if (!onReceiptItemCustomUpdate) return;
    const base = getCustomDefaults(item);
    onReceiptItemCustomUpdate(item.id, {
      ...base,
      ...overrides,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] max-w-6xl h-[94vh] overflow-hidden p-0 gap-0 flex flex-col">
        <DialogHeader className="px-5 py-4 border-b bg-background">
          <DialogTitle className="text-2xl">Complete Checkout</DialogTitle>
          <DialogDescription>
            Review and edit the full receipt before confirming payment.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-background">
          <div className="lg:col-span-4 border-r bg-muted/20 overflow-y-auto p-4 space-y-4">
            {customerName || customerEmail || customerPhone ? (
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Customer Information
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setIsCustomerDialogOpen(true)}
                  >
                    Edit
                  </Button>
                </div>
                <div className="space-y-2">
                  {customerName && (
                    <div className="flex items-center text-sm">
                      <User className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span className="font-medium">{customerName}</span>
                    </div>
                  )}
                  {customerEmail && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span>{customerEmail}</span>
                    </div>
                  )}
                  {customerPhone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span>{customerPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => setIsCustomerDialogOpen(true)}
              >
                <User className="mr-2 h-4 w-4" />
                Add Customer Information
              </Button>
            )}

            {hasRentalItems && (
              <div className="space-y-3 rounded-lg border  p-4">
                <h4 className="text-sm font-semibold">Default Rental Period</h4>
                <div className="grid gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">From</label>
                    <Input
                      type="datetime-local"
                      value={rentalStartDate}
                      onChange={(e) => setRentalStartDate?.(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">To</label>
                    <Input
                      type="datetime-local"
                      value={rentalEndDate}
                      onChange={(e) => setRentalEndDate?.(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border  px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Apply To All Rental Items</p>
                    <p className="text-xs text-muted-foreground">
                      Keep all rental lines synced with default dates
                    </p>
                  </div>
                  <Switch
                    checked={autoApplyRentalDates}
                    onCheckedChange={setAutoApplyRentalDates}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3 bg-background p-4 rounded-lg border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium text-foreground">
                  {currencySymbol}
                  {cartSubtotal.toFixed(2)}
                </span>
              </div>
              {discountAmount > 0 && (
                <>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Discount{" "}
                      {discountLabel
                        ? `(${discountLabel})`
                        : discountType === "percentage"
                        ? `(${discountValue}%)`
                        : ""}
                    </span>
                    <span className="text-destructive font-semibold">
                      -{currencySymbol}
                      {discountAmount.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Tax ({taxRate}%):</span>
                <span className="font-medium text-foreground">
                  {currencySymbol}
                  {taxAmount.toFixed(2)}
                </span>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-semibold text-base text-foreground">
                  Total Amount:
                </span>
                <span className="text-2xl font-bold text-primary">
                  {currencySymbol}
                  {cartTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between sticky top-0 z-10">
              <h4 className="font-semibold flex items-center gap-2">
                <ReceiptText className="h-4 w-4 text-primary" />
                Full Receipt
              </h4>
              <div className="flex items-center gap-3">
                {onAddCustomLine && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={onAddCustomLine}
                  >
                    Add Custom Item
                  </Button>
                )}
                <span className="text-xs text-muted-foreground">
                  {receiptItems.length} line
                  {receiptItems.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {receiptItems.map((item) => {
                const isEditing = Boolean(editingRows[item.id]);
                const isCustom = item.isCustom || Boolean(item.customLine);
                return (
                <div key={item.id} className="p-2 border-b space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm leading-tight">
                        {item.customLine?.name || item.name}
                        {item.variationName ? ` (${item.variationName})` : ""}
                        {item.isRental &&
                        (item.rentalStartDate || item.rentalEndDate) ? (
                          <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                            {formatShortDate(item.rentalStartDate)}
                            {item.rentalEndDate
                              ? ` - ${formatShortDate(item.rentalEndDate)}`
                              : ""}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.quantity} {item.unitLabel || "unit"} × {currencySymbol}
                        {item.unitPrice.toFixed(2)}
                        {!isCustom && (
                          <>
                            {" • "}
                            Stock:{" "}
                            {typeof item.stock === "number" ? item.stock : "—"}{" "}
                            {item.unitLabel || "unit"}
                          </>
                        )}
                      </p>
                      {isCustom && (item.customLine?.serviceType || item.customLine?.workerName) && (
                        <p className="text-[11px] text-muted-foreground">
                          {item.customLine?.serviceType || "Custom"}
                          {item.customLine?.workerName
                            ? ` • ${item.customLine.workerName}`
                            : ""}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[11px] font-semibold text-foreground px-1.5">
                          {currencySymbol}
                          {item.unitPrice.toFixed(2)}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant={isEditing ? "default" : "outline"}
                          className="h-6 px-2 text-[10px]"
                          onClick={() =>
                            setEditingRows((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id],
                            }))
                          }
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          {isEditing ? "Done" : "Edit"}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          onClick={() => onReceiptItemRemove?.(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-0.5 md:grid-cols-3">
                    <div className="space-y-0 md:col-span-1">
                      <label className="text-[11px] text-muted-foreground">
                        Qty ({item.unitLabel || "unit"})
                      </label>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="h-8 text-xs"
                          value={item.quantity}
                          onChange={(e) => {
                            const qty = parseFloat(e.target.value);
                            if (!Number.isNaN(qty)) {
                              onReceiptItemQuantityChange?.(item.id, qty);
                            }
                          }}
                        />
                      ) : (
                        <div className="h-8 px-0.5 flex items-center text-xs">
                          {item.quantity} {item.unitLabel || "unit"}
                        </div>
                      )}
                    </div>
                    <div className="space-y-0 md:col-span-2">
                      <label className="text-[11px] text-muted-foreground">Type</label>
                      {isEditing ? (
                        <div className="h-8 rounded-md border px-1.5 flex items-center gap-1">
                          {isCustom ? (
                            <Badge>Custom Line</Badge>
                          ) : (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant={item.isRental ? "outline" : "default"}
                                className="h-6 px-2 text-[10px]"
                                onClick={() =>
                                  onReceiptItemModeChange?.(item.id, false)
                                }
                              >
                                Sell
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={item.isRental ? "default" : "outline"}
                                className="h-6 px-2 text-[10px]"
                                onClick={() =>
                                  onReceiptItemModeChange?.(item.id, true)
                                }
                              >
                                Rent
                              </Button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="h-8 px-0.5 flex items-center text-xs">
                          {isCustom ? (
                            <Badge>Custom Line</Badge>
                          ) : item.isRental ? (
                            <Badge>Rental Line</Badge>
                          ) : (
                            <span className="text-muted-foreground">Sale Line</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isCustom && isEditing && (
                    <div className="grid gap-2 md:grid-cols-2 border rounded-md p-2.5">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[11px] text-muted-foreground">
                          Custom Item Name
                        </label>
                        <Input
                          className="h-8 text-xs"
                          value={item.customLine?.name || item.name}
                          onChange={(e) =>
                            handleCustomUpdate(item, { name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">
                          Unit Price
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="h-8 text-xs"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleCustomUpdate(item, {
                              price: Number.parseFloat(e.target.value || "0"),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">
                          Unit Label
                        </label>
                        <Input
                          className="h-8 text-xs"
                          value={item.unitLabel || ""}
                          onChange={(e) =>
                            handleCustomUpdate(item, {
                              unitLabel: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">
                          Service Type
                        </label>
                        <Input
                          className="h-8 text-xs"
                          value={item.customLine?.serviceType || ""}
                          onChange={(e) =>
                            handleCustomUpdate(item, {
                              serviceType: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">
                          Worker
                        </label>
                        {workers.length > 0 ? (
                          <div className="h-8">
                            <select
                              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                              value={item.customLine?.workerId || ""}
                              onChange={(e) =>
                                handleCustomUpdate(item, {
                                  workerId: e.target.value || undefined,
                                  workerName: resolveWorkerName(
                                    e.target.value || undefined,
                                    item.customLine?.workerName
                                  ),
                                })
                              }
                            >
                              <option value="">None</option>
                              {workers.map((worker) => (
                                <option key={worker.id} value={worker.id}>
                                  {worker.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <Input
                            className="h-8 text-xs"
                            value={item.customLine?.workerName || ""}
                            onChange={(e) =>
                              handleCustomUpdate(item, {
                                workerName: e.target.value,
                              })
                            }
                          />
                        )}
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[11px] text-muted-foreground">
                          Notes
                        </label>
                        <textarea
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                          rows={2}
                          value={item.customLine?.notes || ""}
                          onChange={(e) =>
                            handleCustomUpdate(item, { notes: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-md border px-2 py-1 md:col-span-2">
                        <div>
                          <p className="text-[11px] font-medium text-foreground">
                            Taxable
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Apply sales tax to this line
                          </p>
                        </div>
                        <Switch
                          checked={
                            item.customLine?.taxable ?? item.taxable ?? false
                          }
                          onCheckedChange={(value) =>
                            handleCustomUpdate(item, { taxable: value })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {item.isRental && isEditing && !isCustom && (
                    <details className="rounded-md border bg-muted/20">
                      <summary className="cursor-pointer select-none px-2.5 py-1.5 text-[11px] text-muted-foreground">
                        Rental Start / Rental End
                      </summary>
                      <div className="grid gap-2 md:grid-cols-2 p-2.5 border-t">
                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground">
                            Rental Start
                          </label>
                          <Input
                            type="datetime-local"
                            className="h-8 text-xs"
                            value={item.rentalStartDate || ""}
                            onChange={(e) =>
                              onReceiptItemRentalDatesChange?.(item.id, {
                                rentalStartDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground">
                            Rental End
                          </label>
                          <Input
                            type="datetime-local"
                            className="h-8 text-xs"
                            value={item.rentalEndDate || ""}
                            onChange={(e) =>
                              onReceiptItemRentalDatesChange?.(item.id, {
                                rentalEndDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              )})}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 px-5 py-3 border-t bg-background justify-end">
          <Button variant="outline" onClick={onClose} className="sm:min-w-28">
            Cancel
          </Button>
          <Button onClick={handleCheckout} className="sm:min-w-36 h-10 shadow-md">
            Complete Purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
