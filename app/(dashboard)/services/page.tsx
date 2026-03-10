"use client";

import { useMemo, useState } from "react";
import { Wrench, Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { usePosData } from "@/components/pos-data-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ServicesPage() {
  const { t } = useLanguage();
  const { services, addService, updateService, removeService } = usePosData();

  const getBillingLabel = (type: "per_day" | "per_count" | "custom") =>
    type === "per_day" ? t("services.perDay") : type === "per_count" ? t("services.perCount") : t("services.custom");

  const [query, setQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [billingType, setBillingType] = useState<
    "per_day" | "per_count" | "custom"
  >("per_count");
  const [unitLabel, setUnitLabel] = useState("");
  const [taxable, setTaxable] = useState(false);
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setName("");
    setPrice("");
    setBillingType("per_count");
    setUnitLabel("");
    setTaxable(false);
    setDescription("");
    setSelectedServiceId("");
  };

  const filteredServices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return services;
    return services.filter((service) => {
      return (
        service.name.toLowerCase().includes(normalized) ||
        (service.description || "").toLowerCase().includes(normalized)
      );
    });
  }, [services, query]);

  const openEdit = (serviceId: string) => {
    const service = services.find((item) => item.id === serviceId);
    if (!service) return;
    setSelectedServiceId(service.id);
    setName(service.name);
    setPrice(String(service.price || 0));
    setBillingType(service.billingType);
    setUnitLabel(service.unitLabel || "");
    setTaxable(service.taxable === true);
    setDescription(service.description || "");
    setIsEditOpen(true);
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      setIsSaving(true);
      await addService({
        name,
        price: Number(price || 0),
        billingType,
        unitLabel: unitLabel.trim() || undefined,
        taxable,
        description: description.trim() || undefined,
        isActive: true,
      });
      setIsAddOpen(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    const service = services.find((item) => item.id === selectedServiceId);
    if (!service || !name.trim()) return;
    try {
      setIsSaving(true);
      await updateService({
        ...service,
        name,
        price: Number(price || 0),
        billingType,
        unitLabel: unitLabel.trim() || undefined,
        taxable,
        description: description.trim() || undefined,
      });
      setIsEditOpen(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 overflow-hidden min-w-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          {t("services.title")}
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          {t("services.subtitle")}
        </p>
      </div>

      <Card className="border-2">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {/* <CardTitle>Service Catalog</CardTitle> */}
              <CardDescription>
                {filteredServices.length}{" "}
                {filteredServices.length === 1 ? t("services.serviceSingular") : t("services.services")}{" "}
                {t("services.found")}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Input
                placeholder={t("services.searchPlaceholder")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="sm:max-w-xs"
              />
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("services.addService")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("services.service")}</TableHead>
                  <TableHead>{t("services.billingType")}</TableHead>
                  <TableHead>{t("services.unit")}</TableHead>
                  <TableHead>{t("services.price")}</TableHead>
                  <TableHead>{t("services.taxable")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <p className="text-sm text-muted-foreground">
                        {t("services.noServicesFound")}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="font-medium">{service.name}</div>
                        {service.description && (
                          <div className="text-xs text-muted-foreground">
                            {service.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getBillingLabel(service.billingType)}
                      </TableCell>
                      <TableCell>{service.unitLabel || "—"}</TableCell>
                      <TableCell>${Number(service.price || 0).toFixed(2)}</TableCell>
                      <TableCell>{service.taxable !== false ? t("common.yes") : t("common.no")}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(service.id)}>
                              <Pencil className="me-2 h-4 w-4" />
                              {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => removeService(service.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="me-2 h-4 w-4" />
                              {t("common.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("services.addService")}</DialogTitle>
            <DialogDescription>
              {t("services.addServiceDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>{t("services.serviceName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("services.price")}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("services.billingType")}</Label>
                <Select
                  value={billingType}
                  onValueChange={(value) =>
                    setBillingType(value as "per_day" | "per_count" | "custom")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("services.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_day">{t("services.perDay")}</SelectItem>
                    <SelectItem value="per_count">{t("services.perCount")}</SelectItem>
                    <SelectItem value="custom">{t("services.custom")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("services.unitLabel")}</Label>
                <Input
                  placeholder={t("services.unitPlaceholder")}
                  value={unitLabel}
                  onChange={(e) => setUnitLabel(e.target.value)}
                />
              </div>
              <SwitchRow className="rounded-md border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{t("services.taxable")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("services.applySalesTaxDefault")}
                  </p>
                </div>
                <Switch checked={taxable} onCheckedChange={setTaxable} />
              </SwitchRow>
            </div>
            <div className="space-y-2">
              <Label>{t("services.description")}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAdd} disabled={isSaving}>
              {t("services.saveService")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("services.editService")}</DialogTitle>
            <DialogDescription>
              {t("services.editServiceDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>{t("services.serviceName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("services.price")}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("services.billingType")}</Label>
                <Select
                  value={billingType}
                  onValueChange={(value) =>
                    setBillingType(value as "per_day" | "per_count" | "custom")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("services.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_day">{t("services.perDay")}</SelectItem>
                    <SelectItem value="per_count">{t("services.perCount")}</SelectItem>
                    <SelectItem value="custom">{t("services.custom")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("services.unitLabel")}</Label>
                <Input
                  placeholder={t("services.unitPlaceholder")}
                  value={unitLabel}
                  onChange={(e) => setUnitLabel(e.target.value)}
                />
              </div>
              <SwitchRow className="rounded-md border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{t("services.taxable")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("services.applySalesTaxDefault")}
                  </p>
                </div>
                <Switch checked={taxable} onCheckedChange={setTaxable} />
              </SwitchRow>
            </div>
            <div className="space-y-2">
              <Label>{t("services.description")}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleEdit} disabled={isSaving}>
              {t("common.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
