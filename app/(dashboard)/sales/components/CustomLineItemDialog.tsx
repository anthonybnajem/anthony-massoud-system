"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SwitchRow } from "@/components/ui/switch-row";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Worker } from "@/components/pos-data-provider";

export type CustomLineDraft = {
  name: string;
  price: number;
  quantity: number;
  unitLabel?: string;
  source?: "custom" | "worker" | "service";
  workerId?: string;
  workerName?: string;
  serviceType?: string;
  notes?: string;
  taxable: boolean;
};

interface CustomLineItemDialogProps {
  isOpen: boolean;
  title?: string;
  workers?: Worker[];
  initialValue?: CustomLineDraft | null;
  onClose: () => void;
  onSave: (line: CustomLineDraft) => void;
}

export function CustomLineItemDialog({
  isOpen,
  title = "Add Custom Item",
  workers = [],
  initialValue,
  onClose,
  onSave,
}: CustomLineItemDialogProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [quantity, setQuantity] = useState("1");
  const [unitLabel, setUnitLabel] = useState("");
  const [workerId, setWorkerId] = useState<string>("");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");
  const [taxable, setTaxable] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialValue) {
      setName(initialValue.name);
      setPrice(String(initialValue.price));
      setQuantity(String(initialValue.quantity));
      setUnitLabel(initialValue.unitLabel || "");
      setWorkerId(initialValue.workerId || "");
      setServiceType(initialValue.serviceType || "");
      setNotes(initialValue.notes || "");
      setTaxable(initialValue.taxable ?? false);
    } else {
      setName("");
      setPrice("0");
      setQuantity("1");
      setUnitLabel("");
      setWorkerId("");
      setServiceType("");
      setNotes("");
      setTaxable(false);
    }
  }, [isOpen, initialValue]);

  const workerName = useMemo(
    () => workers.find((worker) => worker.id === workerId)?.name || undefined,
    [workers, workerId]
  );

  const handleSave = () => {
    const parsedPrice = Number.parseFloat(price);
    const parsedQty = Number.parseFloat(quantity);
    if (!name.trim() || Number.isNaN(parsedPrice) || parsedPrice < 0) return;
    if (Number.isNaN(parsedQty) || parsedQty <= 0) return;

    onSave({
      name: name.trim(),
      price: parsedPrice,
      quantity: parsedQty,
      unitLabel: unitLabel.trim() || undefined,
      workerId: workerId || undefined,
      workerName,
      serviceType: serviceType.trim() || undefined,
      notes: notes.trim() || undefined,
      taxable,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title !== undefined ? title : t("sales.addCustomItem")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>{t("sales.customLineItemName")}</Label>
              <Input
                placeholder={t("sales.customLineItemNamePlaceholder")}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("sales.price")}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("sales.quantity")}</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("sales.unitLabelOptional")}</Label>
              <Input
                placeholder={t("sales.unitLabelPlaceholder")}
                value={unitLabel}
                onChange={(event) => setUnitLabel(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("sales.workerOptional")}</Label>
              <Select value={workerId || "__none__"} onValueChange={(value) => setWorkerId(value === "__none__" ? "" : value)}>
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
            </div>
            <div className="space-y-2">
              <Label>{t("sales.serviceTypeOptional")}</Label>
              <Input
                placeholder={t("sales.serviceTypePlaceholder")}
                value={serviceType}
                onChange={(event) => setServiceType(event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t("sales.notesOptional")}</Label>
              <textarea
                className="w-full rounded-[14px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-slate-500"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <SwitchRow className="rounded-[14px] border border-slate-300 bg-white px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700">{t("sales.taxable")}</p>
                <p className="text-xs text-slate-500">
                  {t("sales.taxableDesc")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground" aria-hidden>
                  {taxable ? t("common.on") : t("common.off")}
                </span>
                <Switch checked={taxable} onCheckedChange={setTaxable} />
              </div>
            </SwitchRow>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
