"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Eye, Pencil, UserPlus, Wrench } from "lucide-react";
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

  const resetForm = () => {
    setName("");
    setSpecialty("");
    setPhone("");
    setEmail("");
    setDailyRate("");
    setHourlyRate("");
    setNotes("");
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
        isActive: true,
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
          Workers
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Manage labor services your company provides to customer projects.
        </p>
      </div>

      <Card className="border-2">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Worker Directory</CardTitle>
              <CardDescription>
                {filteredWorkers.length}{" "}
                {filteredWorkers.length === 1 ? "worker" : "workers"} found
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Input
                placeholder="Search by name, specialty, or contact"
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
                <UserPlus className="mr-2 h-4 w-4" />
                Add Worker
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Daily Rate</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Active Assignments</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{worker.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {worker.phone || worker.email || "No contact"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{worker.specialty || "General labor"}</TableCell>
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/workers/${encodeURIComponent(worker.id)}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(worker.id)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeWorker(worker.id)}
                        >
                          Archive
                        </Button>
                      </div>
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
            <DialogTitle>Add Worker</DialogTitle>
            <DialogDescription>
              Create a worker profile for project assignments.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Worker Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Specialty</Label>
              <Input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Rebar technician, welder, carpenter..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Daily Rate</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hourly Rate</Label>
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
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isSaving || !name.trim()}>
              {isSaving ? "Saving..." : "Save Worker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Worker</DialogTitle>
            <DialogDescription>Update worker details and pricing.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Worker Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Specialty</Label>
              <Input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Daily Rate</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hourly Rate</Label>
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
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSaving || !name.trim()}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
