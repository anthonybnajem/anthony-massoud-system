"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Briefcase, FolderKanban, Wrench } from "lucide-react";
import { usePosData } from "@/components/pos-data-provider";
import { useReceiptSettings } from "@/components/receipt-settings-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function WorkerDetailsPage() {
  const params = useParams();
  const workerId = decodeURIComponent((params?.workerId as string) || "");
  const {
    workers,
    projects,
    customers,
    projectWorkerAssignments,
    assignWorkerToProject,
  } = usePosData();
  const { settings } = useReceiptSettings();
  const currencySymbol = settings?.currencySymbol || "$";
  const [assignmentMode, setAssignmentMode] = useState<"project" | "custom">(
    "project"
  );
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [customJobName, setCustomJobName] = useState("");
  const [customCustomerName, setCustomCustomerName] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [role, setRole] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const worker = useMemo(
    () => workers.find((item) => item.id === workerId),
    [workers, workerId]
  );

  const projectMap = useMemo(
    () =>
      projects.reduce<Record<string, (typeof projects)[number]>>((acc, project) => {
        acc[project.id] = project;
        return acc;
      }, {}),
    [projects]
  );

  const customerMap = useMemo(
    () =>
      customers.reduce<Record<string, string>>((acc, customer) => {
        acc[customer.id] = customer.name;
        return acc;
      }, {}),
    [customers]
  );

  const assignments = useMemo(
    () =>
      projectWorkerAssignments
        .filter((assignment) => assignment.workerId === workerId)
        .sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        ),
    [projectWorkerAssignments, workerId]
  );

  const activeAssignments = assignments.filter(
    (assignment) => assignment.status === "active"
  );

  const handleAssign = async () => {
    if (!worker) return;
    if (assignmentMode === "project" && !selectedProjectId) return;
    if (assignmentMode === "custom" && !customJobName.trim()) return;
    try {
      setIsAssigning(true);
      await assignWorkerToProject({
        projectId: assignmentMode === "project" ? selectedProjectId : undefined,
        workerId: worker.id,
        customJobName: assignmentMode === "custom" ? customJobName : undefined,
        customCustomerName:
          assignmentMode === "custom" ? customCustomerName : undefined,
        customLocation: assignmentMode === "custom" ? customLocation : undefined,
        role,
        startDate: new Date(startDate),
        dailyRate: Number(dailyRate || worker.dailyRate || 0),
        notes,
      });
      setSelectedProjectId("");
      setCustomJobName("");
      setCustomCustomerName("");
      setCustomLocation("");
      setRole("");
      setDailyRate("");
      setNotes("");
    } finally {
      setIsAssigning(false);
    }
  };

  if (!worker) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/workers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wrench className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Worker not found</EmptyTitle>
            <EmptyDescription>
              This worker does not exist or was archived.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-hidden min-w-0">
      <div className="flex items-center gap-3 flex-wrap">
        <Button asChild variant="ghost" size="sm">
          <Link href="/workers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{worker.name}</h1>
          <p className="text-muted-foreground">
            {worker.specialty || "General labor"} • {currencySymbol}
            {worker.dailyRate.toFixed(2)}/day
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeAssignments.length}</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{assignments.length}</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{worker.phone || "Not set"}</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{worker.email || "Not set"}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Assign New Job
          </CardTitle>
          <CardDescription>
            Assign this worker to a linked project or a custom standalone job.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Assignment Type</Label>
              <Select
                value={assignmentMode}
                onValueChange={(value) =>
                  setAssignmentMode(value as "project" | "custom")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">By Project</SelectItem>
                  <SelectItem value="custom">Custom Job</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="Foreman / Welder / Installer"
              />
            </div>
          </div>

          {assignmentMode === "project" ? (
            <div className="space-y-1">
              <Label>Project</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1 md:col-span-1">
                <Label>Custom Job Name</Label>
                <Input
                  value={customJobName}
                  onChange={(event) => setCustomJobName(event.target.value)}
                  placeholder="Night shift wiring"
                />
              </div>
              <div className="space-y-1">
                <Label>Customer / Company</Label>
                <Input
                  value={customCustomerName}
                  onChange={(event) => setCustomCustomerName(event.target.value)}
                  placeholder="Private client name"
                />
              </div>
              <div className="space-y-1">
                <Label>Location</Label>
                <Input
                  value={customLocation}
                  onChange={(event) => setCustomLocation(event.target.value)}
                  placeholder="Site location"
                />
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Rate / Day</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={dailyRate}
                onChange={(event) => setDailyRate(event.target.value)}
                placeholder={String(worker.dailyRate)}
              />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={1}
                placeholder="Optional job notes"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleAssign}
              disabled={
                isAssigning ||
                (assignmentMode === "project" && !selectedProjectId) ||
                (assignmentMode === "custom" && !customJobName.trim())
              }
            >
              {isAssigning ? "Assigning..." : "Assign Job"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Where He Is Working Now</CardTitle>
          <CardDescription>
            Active project and custom assignments for this worker.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active assignment right now.
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>Rate/Day</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAssignments.map((assignment) => {
                    const project = assignment.projectId
                      ? projectMap[assignment.projectId]
                      : undefined;
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          {project ? (
                            <Link
                              href={`/projects/${encodeURIComponent(project.id)}`}
                              className="text-primary hover:underline"
                            >
                              {project.name}
                            </Link>
                          ) : assignment.customJobName ? (
                            <span>{assignment.customJobName}</span>
                          ) : (
                            "Unspecified custom job"
                          )}
                        </TableCell>
                        <TableCell>
                          {project
                            ? customerMap[project.customerId] || "Unknown customer"
                            : assignment.customCustomerName || "—"}
                        </TableCell>
                        <TableCell>{assignment.role || "Assigned worker"}</TableCell>
                        <TableCell>
                          {format(new Date(assignment.startDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {currencySymbol}
                          {assignment.dailyRate.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Assignment History</CardTitle>
          <CardDescription>All current and completed project assignments.</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assignment history yet.
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => {
                    const project = assignment.projectId
                      ? projectMap[assignment.projectId]
                      : undefined;
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            {project
                              ? project.name
                              : assignment.customJobName || "Custom job"}
                          </div>
                        </TableCell>
                        <TableCell>{assignment.role || "Assigned worker"}</TableCell>
                        <TableCell>
                          {format(new Date(assignment.startDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {assignment.endDate
                            ? format(new Date(assignment.endDate), "MMM dd, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              assignment.status === "active" ? "default" : "secondary"
                            }
                          >
                            {assignment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
