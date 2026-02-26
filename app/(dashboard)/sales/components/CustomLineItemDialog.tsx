"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Service / Item Name</Label>
              <Input
                placeholder="Custom service name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit Label (optional)</Label>
              <Input
                placeholder="day, hour, service..."
                value={unitLabel}
                onChange={(event) => setUnitLabel(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Worker (optional)</Label>
              <Select value={workerId || "__none__"} onValueChange={(value) => setWorkerId(value === "__none__" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service Type (optional)</Label>
              <Input
                placeholder="Installation, Delivery, Labor..."
                value={serviceType}
                onChange={(event) => setServiceType(event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes (optional)</Label>
              <textarea
                className="w-full rounded-[14px] border border-white/30 bg-white/20 px-3 py-2 text-sm text-slate-700 backdrop-blur-[16px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-[14px] border border-white/30 bg-white/20 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-700">Taxable</p>
                <p className="text-xs text-slate-500">
                  Apply sales tax to this line
                </p>
              </div>
              <Switch checked={taxable} onCheckedChange={setTaxable} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
