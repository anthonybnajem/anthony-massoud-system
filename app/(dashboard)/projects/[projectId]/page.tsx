"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, FolderKanban, UserPlus2, Wrench } from "lucide-react";
import { usePosData } from "@/components/pos-data-provider";
import { useReceiptSettings } from "@/components/receipt-settings-provider";
import { useLanguage } from "@/components/language-provider";
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

type AggregateRow = {
  key: string;
  name: string;
  quantity: number;
  amount: number;
};

export default function ProjectDetailsPage() {
  const { t } = useLanguage();
  const params = useParams();
  const projectId = decodeURIComponent((params?.projectId as string) || "");
  const {
    projects,
    customers,
    sales,
    workers,
    projectWorkerAssignments,
    assignWorkerToProject,
    updateProjectWorkerAssignment,
  } = usePosData();
  const { settings } = useReceiptSettings();
  const currencySymbol = settings?.currencySymbol || "$";
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [assignmentRole, setAssignmentRole] = useState("");
  const [assignmentStartDate, setAssignmentStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [assignmentDailyRate, setAssignmentDailyRate] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const project = useMemo(
    () => projects.find((item) => item.id === projectId),
    [projects, projectId]
  );

  const customerName = useMemo(() => {
    if (!project) return "";
    return (
      customers.find((customer) => customer.id === project.customerId)?.name ||
      t("projects.unknownCustomer")
    );
  }, [customers, project, t]);

  const projectSales = useMemo(
    () =>
      sales.filter(
        (sale) => sale.projectId === projectId && (sale.status || "completed") !== "voided"
      ),
    [sales, projectId]
  );

  const soldRows = useMemo(() => {
    const map = new Map<string, AggregateRow>();
    projectSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const isRental = item.isRental || item.product?.saleType === "rental";
        if (isRental) return;
        const key = item.productId;
        const current = map.get(key) || {
          key,
          name: item.product?.name || item.productId || t("projects.item"),
          quantity: 0,
          amount: 0,
        };
        current.quantity += item.quantity;
        current.amount += item.quantity * item.price;
        map.set(key, current);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [projectSales, t]);

  const rentedRows = useMemo(() => {
    const map = new Map<string, AggregateRow>();
    projectSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const isRental = item.isRental || item.product?.saleType === "rental";
        if (!isRental) return;
        const key = item.productId;
        const current = map.get(key) || {
          key,
          name: item.product?.name || item.productId || t("projects.item"),
          quantity: 0,
          amount: 0,
        };
        current.quantity += item.quantity;
        current.amount += item.quantity * item.price;
        map.set(key, current);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [projectSales, t]);

  const totals = useMemo(() => {
    const soldQty = soldRows.reduce((sum, row) => sum + row.quantity, 0);
    const rentedQty = rentedRows.reduce((sum, row) => sum + row.quantity, 0);
    const soldAmount = soldRows.reduce((sum, row) => sum + row.amount, 0);
    const rentedAmount = rentedRows.reduce((sum, row) => sum + row.amount, 0);
    const activeRentals = projectSales.filter(
      (sale) =>
        sale.items.some((item) => item.isRental || item.product?.saleType === "rental") &&
        sale.rentalStatus === "active"
    ).length;
    return { soldQty, rentedQty, soldAmount, rentedAmount, activeRentals };
  }, [soldRows, rentedRows, projectSales]);

  const workerMap = useMemo(
    () =>
      workers.reduce<Record<string, (typeof workers)[number]>>((acc, worker) => {
        acc[worker.id] = worker;
        return acc;
      }, {}),
    [workers]
  );

  const projectAssignments = useMemo(
    () =>
      projectWorkerAssignments
        .filter((assignment) => assignment.projectId === projectId)
        .sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        ),
    [projectWorkerAssignments, projectId]
  );

  const handleAssignWorker = async () => {
    if (!selectedWorkerId || !assignmentStartDate) return;
    const selectedWorker = workers.find((worker) => worker.id === selectedWorkerId);
    try {
      setIsAssigning(true);
      await assignWorkerToProject({
        projectId,
        workerId: selectedWorkerId,
        role: assignmentRole,
        startDate: new Date(assignmentStartDate),
        dailyRate: Number(assignmentDailyRate || selectedWorker?.dailyRate || 0),
        notes: assignmentNotes,
      });
      setSelectedWorkerId("");
      setAssignmentRole("");
      setAssignmentDailyRate("");
      setAssignmentNotes("");
    } finally {
      setIsAssigning(false);
    }
  };

  const markAssignmentCompleted = async (assignmentId: string) => {
    const assignment = projectAssignments.find((item) => item.id === assignmentId);
    if (!assignment || assignment.status !== "active") return;
    await updateProjectWorkerAssignment({
      ...assignment,
      status: "completed",
      endDate: new Date(),
    });
  };

  if (!project) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/projects">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t("common.back")}
          </Link>
        </Button>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanban className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>{t("projects.projectNotFound")}</EmptyTitle>
            <EmptyDescription>
              {t("projects.projectNotFoundDesc")}
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
          <Link href="/projects">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t("common.back")}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">
            {customerName} • {project.location || t("projects.noLocation")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("projects.receipts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{projectSales.length}</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("projects.soldQty")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.soldQty}</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("projects.rentedQty")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.rentedQty}</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("projects.soldAmount")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {currencySymbol}
              {totals.soldAmount.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("projects.activeRentals")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.activeRentals}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            {t("projects.projectWorkforce")}
          </CardTitle>
          <CardDescription>
            {t("projects.assignWorkersDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="space-y-2 lg:col-span-2">
              <Label>{t("workers.worker")}</Label>
              <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("projects.selectWorkerPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name}
                      {worker.specialty ? ` (${worker.specialty})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("workers.role")}</Label>
              <Input
                value={assignmentRole}
                onChange={(event) => setAssignmentRole(event.target.value)}
                placeholder={t("projects.specialtyPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("workers.startDate")}</Label>
              <Input
                type="date"
                value={assignmentStartDate}
                onChange={(event) => setAssignmentStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("workers.dailyRate")}</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={assignmentDailyRate}
                onChange={(event) => setAssignmentDailyRate(event.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("projects.notes")}</Label>
            <Textarea
              value={assignmentNotes}
              onChange={(event) => setAssignmentNotes(event.target.value)}
              rows={2}
              placeholder={t("projects.shiftNotesPlaceholder")}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleAssignWorker}
              disabled={isAssigning || !selectedWorkerId || !assignmentStartDate}
            >
              <UserPlus2 className="me-2 h-4 w-4" />
              {isAssigning ? t("projects.assigning") : t("projects.assignWorker")}
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("workers.worker")}</TableHead>
                  <TableHead>{t("workers.role")}</TableHead>
                  <TableHead>{t("projects.start")}</TableHead>
                  <TableHead>{t("projects.end")}</TableHead>
                  <TableHead>{t("projects.ratePerDay")}</TableHead>
                  <TableHead>{t("receipts.statusLabel")}</TableHead>
                  <TableHead className="text-end">{t("projects.action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {t("projects.noWorkersAssignedYet")}
                    </TableCell>
                  </TableRow>
                ) : (
                  projectAssignments.map((assignment) => {
                    const worker = workerMap[assignment.workerId];
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {worker?.name || t("projects.unknownWorker")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {worker?.specialty || t("projects.generalLabor")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{assignment.role || t("projects.assignedWorker")}</TableCell>
                        <TableCell>
                          {format(new Date(assignment.startDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {assignment.endDate
                            ? format(new Date(assignment.endDate), "MMM dd, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {currencySymbol}
                          {assignment.dailyRate.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              assignment.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {assignment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          {assignment.status === "active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAssignmentCompleted(assignment.id)}
                            >
                              {t("projects.complete")}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {t("projects.closed")}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>{t("projects.soldItems")}</CardTitle>
          <CardDescription>{t("projects.itemsSoldUnder")}</CardDescription>
        </CardHeader>
        <CardContent>
          {soldRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("projects.noSoldItemsYet")}</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("projects.item")}</TableHead>
                    <TableHead>{t("projects.qty")}</TableHead>
                    <TableHead className="text-end">{t("reports.amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {soldRows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell className="text-end font-semibold">
                        {currencySymbol}
                        {row.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>{t("projects.rentedItems")}</CardTitle>
          <CardDescription>{t("projects.itemsRentedUnder")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rentedRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("projects.noRentedItemsYet")}</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("projects.item")}</TableHead>
                    <TableHead>{t("projects.qty")}</TableHead>
                    <TableHead className="text-end">{t("reports.amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentedRows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell className="text-end font-semibold">
                        {currencySymbol}
                        {row.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("receipts.receipt")}</TableHead>
                  <TableHead>{t("projects.rentalPeriod")}</TableHead>
                  <TableHead>{t("receipts.statusLabel")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectSales
                  .filter((sale) =>
                    sale.items.some(
                      (item) => item.isRental || item.product?.saleType === "rental"
                    )
                  )
                  .map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <Link
                          href={`/receipts/${encodeURIComponent(sale.id)}`}
                          className="text-primary hover:underline"
                        >
                          #{sale.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sale.rentalStartDate && sale.rentalEndDate
                          ? `${format(new Date(sale.rentalStartDate), "PPp")} -> ${format(
                              new Date(sale.rentalEndDate),
                              "PPp"
                            )}`
                          : t("projects.noRentalDates")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sale.rentalStatus === "returned"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {sale.rentalStatus || "active"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
