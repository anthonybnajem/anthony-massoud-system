"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { usePosData, type Expense } from "@/components/pos-data-provider";
import { useReceiptSettings } from "@/components/receipt-settings-provider";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Pencil } from "lucide-react";

export default function ExpensesHistoryPage() {
  const { t } = useLanguage();
  const { expenses, updateExpense } = usePosData();
  const { settings } = useReceiptSettings();
  const currencySymbol = settings?.currencySymbol ?? "$";

  const dateFilterOptions = useMemo(
    () => [
      { value: "7", label: t("receipts.last7Days") },
      { value: "30", label: t("receipts.last30Days") },
      { value: "90", label: t("receipts.last90Days") },
      { value: "all", label: t("receipts.allTime") },
    ],
    [t]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("30");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [page, setPage] = useState(0);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editPaymentStatus, setEditPaymentStatus] = useState<"paid" | "unpaid" | "partially_paid">("paid");
  const [editAmountPaid, setEditAmountPaid] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, dateFilter, typeFilter, paymentStatusFilter, rowsPerPage]);

  const filteredExpenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const limitDays = dateFilter === "all" ? null : Number(dateFilter);
    const cutoffDate =
      limitDays && Number.isFinite(limitDays)
        ? subDays(new Date(), limitDays)
        : null;

    return [...expenses]
      .filter((exp) => {
        if (query) {
          const haystack = [
            exp.vendor,
            exp.notes,
            exp.id,
            ...exp.items.map((i) => i.description ?? ""),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        if (typeFilter !== "all") {
          const expType = exp.expenseType ?? "expense_out";
          if (expType !== typeFilter) return false;
        }
        if (paymentStatusFilter !== "all") {
          const status = exp.paymentStatus;
          if (status !== paymentStatusFilter) return false;
        }
        if (cutoffDate) {
          const expDate = new Date(exp.date);
          if (expDate < cutoffDate) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchQuery, dateFilter, typeFilter, paymentStatusFilter]);

  const numericRows = Number(rowsPerPage) || 10;
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / numericRows));
  const paginatedExpenses = filteredExpenses.slice(
    page * numericRows,
    page * numericRows + numericRows
  );

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6 overflow-hidden min-w-0">
      <div className="flex items-center gap-3">
        <Link
          href="/expenses"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Link>
      </div>
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          {t("expenses.recentExpenses")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t("expenses.recentExpensesSubtitle")}
        </p>
      </div>

      <Card>
        <CardHeader className="gap-4 space-y-0 md:flex md:items-center md:justify-between">
          <div className="w-full space-y-3 md:flex md:flex-1 md:items-center md:justify-end md:gap-3 md:space-y-0">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("receipts.searchPlaceholder")}
              className="w-full md:w-64"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="md:w-40">
                <SelectValue placeholder={t("expenses.filterByType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("receipts.allStatuses")}</SelectItem>
                <SelectItem value="restock">{t("expenses.typeRestock")}</SelectItem>
                <SelectItem value="expense_out">{t("expenses.typeExpenseOut")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="md:w-40">
                <SelectValue placeholder={t("expenses.filterByPaymentStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("receipts.allStatuses")}</SelectItem>
                <SelectItem value="paid">{t("checkout.paymentStatus.paid")}</SelectItem>
                <SelectItem value="unpaid">{t("checkout.paymentStatus.unpaid")}</SelectItem>
                <SelectItem value="partially_paid">{t("checkout.paymentStatus.partially_paid")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="md:w-40">
                <SelectValue placeholder={t("receipts.dateRange")} />
              </SelectTrigger>
              <SelectContent>
                {dateFilterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          <div className="rounded-lg border min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("expenses.date")}</TableHead>
                  <TableHead>{t("expenses.filterByType")}</TableHead>
                  <TableHead>{t("expenses.vendor")}</TableHead>
                  <TableHead>{t("expenses.items")}</TableHead>
                  <TableHead>{t("expenses.paymentMethod")}</TableHead>
                  <TableHead>{t("expenses.paymentStatus")}</TableHead>
                  <TableHead className="text-right">{t("expenses.amountPaid")}</TableHead>
                  <TableHead className="text-right">{t("expenses.total")}</TableHead>
                  <TableHead className="w-[80px]">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      {t("expenses.noExpensesMatch")}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedExpenses.map((exp) => {
                    const type = exp.expenseType ?? "expense_out";
                    const totalDisplay = Math.abs(exp.total);
                    const itemSummary = exp.items
                      .map((i) => i.description ?? "")
                      .filter(Boolean)
                      .slice(0, 2)
                      .join(", ");
                    const paymentStatus = exp.paymentStatus;
                    const amountPaid = exp.amountPaid;
                    return (
                      <TableRow key={exp.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {format(new Date(exp.date), "PP")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(exp.date), "p")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              type === "restock" ? "default" : "secondary"
                            }
                          >
                            {type === "restock"
                              ? t("expenses.typeRestock")
                              : t("expenses.typeExpenseOut")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {exp.vendor || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-[200px]">
                            <p className="line-clamp-2">{itemSummary || "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {exp.items.length}{" "}
                              {exp.items.length === 1 ? "item" : "items"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {exp.paymentMethod}
                        </TableCell>
                        <TableCell>
                          {paymentStatus ? (
                            <Badge
                              variant={
                                paymentStatus === "paid"
                                  ? "default"
                                  : paymentStatus === "unpaid"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {t(`checkout.paymentStatus.${paymentStatus}`)}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {amountPaid != null && amountPaid > 0
                            ? `${currencySymbol}${amountPaid.toFixed(2)}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {currencySymbol}
                          {totalDisplay.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {type === "expense_out" ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={t("expenses.editPayment")}
                              onClick={() => {
                                setEditingExpense(exp);
                                setEditPaymentStatus((exp.paymentStatus ?? "unpaid") as "paid" | "unpaid" | "partially_paid");
                                setEditAmountPaid(exp.amountPaid ?? 0);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t("common.page")} {page + 1} {t("common.of")} {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="text-sm text-primary disabled:opacity-50"
                >
                  {t("common.previous")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="text-sm text-primary disabled:opacity-50"
                >
                  {t("common.next")}
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("expenses.editPaymentTitle")}</DialogTitle>
            <DialogDescription>{t("expenses.editPaymentDescription")}</DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("checkout.paymentStatus")}</Label>
                <div className="flex flex-col gap-2">
                  {(["paid", "unpaid", "partially_paid"] as const).map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="radio"
                        name="editPaymentStatus"
                        checked={editPaymentStatus === status}
                        onChange={() => setEditPaymentStatus(status)}
                        className="h-4 w-4 border-slate-400 text-primary"
                      />
                      <span>{t(`checkout.paymentStatus.${status}`)}</span>
                    </label>
                  ))}
                </div>
              </div>
              {editPaymentStatus === "partially_paid" && (
                <div className="space-y-2">
                  <Label>{t("checkout.amountPaid")}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={Math.abs(editingExpense.total)}
                    step={0.01}
                    value={editAmountPaid === 0 ? "" : editAmountPaid}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      const total = Math.abs(editingExpense.total);
                      setEditAmountPaid(Number.isNaN(v) ? 0 : Math.max(0, Math.min(total, v)));
                    }}
                    placeholder="0"
                  />
                  {editAmountPaid > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {currencySymbol}
                      {(Math.abs(editingExpense.total) - editAmountPaid).toFixed(2)} {t("checkout.balanceDue")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExpense(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={async () => {
                if (!editingExpense) return;
                try {
                  await updateExpense(editingExpense.id, {
                    paymentStatus: editPaymentStatus,
                    amountPaid: editPaymentStatus === "partially_paid" ? editAmountPaid : undefined,
                  });
                  setEditingExpense(null);
                } catch {
                  // toast from provider
                }
              }}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
