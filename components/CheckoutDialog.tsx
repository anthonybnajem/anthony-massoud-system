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
  const checkoutInputClass =
    "h-8 text-xs !border !border-slate-400 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!border-slate-500";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] max-w-6xl h-[94vh] overflow-hidden p-0 gap-0 flex flex-col bg-white text-slate-900 border-slate-200">
        <DialogHeader className="px-5 py-4 border-b border-slate-200 bg-white">
          <DialogTitle className="text-2xl">Complete Checkout</DialogTitle>
          <DialogDescription className="text-slate-600">
            Review and edit the full receipt before confirming payment.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-white">
          <div className="lg:col-span-4 border-r border-slate-200 bg-white overflow-y-auto p-4 space-y-4">
            {customerName || customerEmail || customerPhone ? (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
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
                      <User className="h-3.5 w-3.5 mr-2 text-slate-500" />
                      <span className="font-medium">{customerName}</span>
                    </div>
                  )}
                  {customerEmail && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-3.5 w-3.5 mr-2 text-slate-500" />
                      <span>{customerEmail}</span>
                    </div>
                  )}
                  {customerPhone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-3.5 w-3.5 mr-2 text-slate-500" />
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
              <div className="space-y-3 rounded-lg border border-slate-200 p-4 bg-white">
                <h4 className="text-sm font-semibold">Default Rental Period</h4>
                <div className="grid gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">From</label>
                    <Input
                      type="datetime-local"
                      className={checkoutInputClass}
                      value={rentalStartDate}
                      onChange={(e) => setRentalStartDate?.(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">To</label>
                    <Input
                      type="datetime-local"
                      className={checkoutInputClass}
                      value={rentalEndDate}
                      onChange={(e) => setRentalEndDate?.(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Apply To All Rental Items</p>
                    <p className="text-xs text-slate-500">
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

            <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-medium text-slate-900">
                  {currencySymbol}
                  {cartSubtotal.toFixed(2)}
                </span>
              </div>
              {discountAmount > 0 && (
                <>
                  <Separator className="my-2 bg-slate-200" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">
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
              <Separator className="my-2 bg-slate-200" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Tax ({taxRate}%):</span>
                <span className="font-medium text-slate-900">
                  {currencySymbol}
                  {taxAmount.toFixed(2)}
                </span>
              </div>
              <Separator className="my-3 bg-slate-200" />
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-semibold text-base text-slate-900">
                  Total Amount:
                </span>
                <span className="text-2xl font-bold text-slate-900">
                  {currencySymbol}
                  {cartTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10">
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
                <span className="text-xs text-slate-500">
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
                <div key={item.id} className="p-2 border-b border-slate-200 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm leading-tight">
                        {item.customLine?.name || item.name}
                        {item.variationName ? ` (${item.variationName})` : ""}
                        {item.isRental &&
                        (item.rentalStartDate || item.rentalEndDate) ? (
                          <span className="ml-2 text-[11px] font-normal text-slate-500">
                            {formatShortDate(item.rentalStartDate)}
                            {item.rentalEndDate
                              ? ` - ${formatShortDate(item.rentalEndDate)}`
                              : ""}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-slate-500">
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
                        <p className="text-[11px] text-slate-500">
                          {item.customLine?.serviceType || "Custom"}
                          {item.customLine?.workerName
                            ? ` • ${item.customLine.workerName}`
                            : ""}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[11px] font-semibold text-slate-900 px-1.5">
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
                      <label className="text-[11px] text-slate-500">
                        Qty ({item.unitLabel || "unit"})
                      </label>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className={checkoutInputClass}
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
                      <label className="text-[11px] text-slate-500">Type</label>
                      {isEditing ? (
                        <div className="h-8 rounded-md border border-slate-200 px-1.5 flex items-center gap-1">
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
                            <span className="text-slate-500">Sale Line</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isCustom && isEditing && (
                    <div className="grid gap-2 md:grid-cols-2 border border-slate-200 rounded-md p-2.5 bg-slate-50/60">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[11px] text-slate-500">
                          Custom Item Name
                        </label>
                        <Input
                          className={checkoutInputClass}
                          value={item.customLine?.name || item.name}
                          onChange={(e) =>
                            handleCustomUpdate(item, { name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-500">
                          Unit Price
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className={checkoutInputClass}
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleCustomUpdate(item, {
                              price: Number.parseFloat(e.target.value || "0"),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-500">
                          Unit Label
                        </label>
                        <Input
                          className={checkoutInputClass}
                          value={item.unitLabel || ""}
                          onChange={(e) =>
                            handleCustomUpdate(item, {
                              unitLabel: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-500">
                          Service Type
                        </label>
                        <Input
                          className={checkoutInputClass}
                          value={item.customLine?.serviceType || ""}
                          onChange={(e) =>
                            handleCustomUpdate(item, {
                              serviceType: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-500">
                          Worker
                        </label>
                        {workers.length > 0 ? (
                          <div className="h-8">
                            <select
                              className="h-8 w-full rounded-md !border !border-slate-400 bg-white px-2 text-xs text-slate-900 focus:outline-none focus:!ring-0 focus:!border-slate-500"
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
                            className={checkoutInputClass}
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
                        <label className="text-[11px] text-slate-500">
                          Notes
                        </label>
                        <textarea
                          className="w-full rounded-md !border !border-slate-400 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:!ring-0 focus:!border-slate-500"
                          rows={2}
                          value={item.customLine?.notes || ""}
                          onChange={(e) =>
                            handleCustomUpdate(item, { notes: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1 md:col-span-2">
                        <div>
                          <p className="text-[11px] font-medium text-slate-900">
                            Taxable
                          </p>
                          <p className="text-[10px] text-slate-500">
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
                    <details className="rounded-md border border-slate-200 bg-slate-50">
                      <summary className="cursor-pointer select-none px-2.5 py-1.5 text-[11px] text-slate-500">
                        Rental Start / Rental End
                      </summary>
                      <div className="grid gap-2 md:grid-cols-2 p-2.5 border-t border-slate-200">
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-500">
                            Rental Start
                          </label>
                          <Input
                            type="datetime-local"
                            className={checkoutInputClass}
                            value={item.rentalStartDate || ""}
                            onChange={(e) =>
                              onReceiptItemRentalDatesChange?.(item.id, {
                                rentalStartDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-500">
                            Rental End
                          </label>
                          <Input
                            type="datetime-local"
                            className={checkoutInputClass}
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

        <DialogFooter className="gap-2 px-5 py-3 border-t border-slate-200 bg-white justify-end">
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
