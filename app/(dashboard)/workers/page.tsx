"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Eye, Pencil, UserPlus, Wrench, MoreVertical, Archive } from "lucide-react";
import { usePosData } from "@/components/pos-data-provider";
import { useLanguage } from "@/components/language-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SwitchRow } from "@/components/ui/switch-row";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function WorkersPage() {
  const { t } = useLanguage();
  const {
    workers,
    projectWorkerAssignments,
    addWorker,
    updateWorker,
    removeWorker,
  } = usePosData();

  const [query, setQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName("");
    setSpecialty("");
    setPhone("");
    setEmail("");
    setDailyRate("");
    setHourlyRate("");
    setNotes("");
    setIsActive(true);
    setSelectedWorkerId("");
  };

  const assignmentCountByWorker = useMemo(() => {
    const countMap = new Map<string, number>();
    projectWorkerAssignments
      .filter((assignment) => assignment.status === "active")
      .forEach((assignment) => {
        countMap.set(
          assignment.workerId,
          (countMap.get(assignment.workerId) || 0) + 1
        );
      });
    return countMap;
  }, [projectWorkerAssignments]);

  const filteredWorkers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return workers;
    return workers.filter((worker) => {
      return (
        worker.name.toLowerCase().includes(normalized) ||
        (worker.specialty || "").toLowerCase().includes(normalized) ||
        (worker.phone || "").toLowerCase().includes(normalized) ||
        (worker.email || "").toLowerCase().includes(normalized)
      );
    });
  }, [workers, query]);

  const openEdit = (workerId: string) => {
    const worker = workers.find((item) => item.id === workerId);
    if (!worker) return;
    setSelectedWorkerId(worker.id);
    setName(worker.name);
    setSpecialty(worker.specialty || "");
    setPhone(worker.phone || "");
    setEmail(worker.email || "");
    setDailyRate(String(worker.dailyRate || 0));
    setHourlyRate(String(worker.hourlyRate || 0));
    setNotes(worker.notes || "");
    setIsActive(worker.isActive !== false);
    setIsEditOpen(true);
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      setIsSaving(true);
      await addWorker({
        name,
        specialty,
        phone,
        email,
        dailyRate: Number(dailyRate || 0),
        hourlyRate: Number(hourlyRate || 0),
        notes,
        isActive,
      });
      setIsAddOpen(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    const worker = workers.find((item) => item.id === selectedWorkerId);
    if (!worker || !name.trim()) return;
    try {
      setIsSaving(true);
      await updateWorker({
        ...worker,
        name,
        specialty,
        phone,
        email,
        dailyRate: Number(dailyRate || 0),
        hourlyRate: Number(hourlyRate || 0),
        notes,
        isActive,
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
          {t("workers.title")}
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          {t("workers.subtitle")}
        </p>
      </div>

      <Card className="border-2">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {/* <CardTitle>Worker Directory</CardTitle> */}
              <CardDescription>
                {filteredWorkers.length}{" "}
                {filteredWorkers.length === 1 ? t("workers.worker") : t("workers.workers")} {t("workers.found")}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Input
                placeholder={t("workers.searchPlaceholder")}
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
                <UserPlus className="me-2 h-4 w-4" />
                {t("workers.addWorker")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("workers.worker")}</TableHead>
                    <TableHead>{t("workers.specialty")}</TableHead>
                    <TableHead>{t("workers.dailyRate")}</TableHead>
                    <TableHead>{t("workers.hourlyRate")}</TableHead>
                    <TableHead>{t("workers.activeAssignments")}</TableHead>
                    <TableHead>{t("workers.updated")}</TableHead>
                    <TableHead className="text-end">{t("customers.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredWorkers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{worker.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {worker.phone || worker.email || t("workers.noContact")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{worker.specialty || t("workers.generalLabor")}</TableCell>
                    <TableCell>${(worker.dailyRate || 0).toFixed(2)}</TableCell>
                    <TableCell>${(worker.hourlyRate || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {assignmentCountByWorker.get(worker.id) || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(worker.updatedAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/workers/${encodeURIComponent(worker.id)}`}
                              className="flex items-center"
                            >
                              <Eye className="me-2 h-4 w-4" />
                              {t("workers.view")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(worker.id)}>
                            <Pencil className="me-2 h-4 w-4" />
                            {t("workers.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => removeWorker(worker.id)}>
                            <Archive className="me-2 h-4 w-4" />
                            {t("workers.archive")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("workers.addWorker")}</DialogTitle>
            <DialogDescription>
              {t("workers.addWorkerDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{t("workers.workerName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("workers.specialty")}</Label>
              <Input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder={t("workers.specialtyPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("workers.phone")}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("workers.email")}</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("workers.dailyRate")}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("workers.hourlyRate")}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("workers.notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <SwitchRow className="rounded-lg border p-4 bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="worker-active" className="text-base font-medium">
                  {t("workers.activeStatus")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("workers.activeStatusDesc")}
                </p>
              </div>
              <Switch
                id="worker-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </SwitchRow>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAdd} disabled={isSaving || !name.trim()}>
              {isSaving ? t("workers.saving") : t("workers.saveWorker")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("workers.editWorker")}</DialogTitle>
            <DialogDescription>{t("workers.editWorkerDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{t("workers.workerName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("workers.specialty")}</Label>
              <Input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("workers.phone")}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("workers.email")}</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("workers.dailyRate")}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("workers.hourlyRate")}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("workers.notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <SwitchRow className="rounded-lg border p-4 bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="edit-worker-active" className="text-base font-medium">
                  {t("workers.activeStatus")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("workers.activeStatusDesc")}
                </p>
              </div>
              <Switch
                id="edit-worker-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </SwitchRow>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleEdit} disabled={isSaving || !name.trim()}>
              {isSaving ? t("workers.saving") : t("common.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
