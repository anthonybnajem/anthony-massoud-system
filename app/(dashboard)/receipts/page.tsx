"use client";

import { useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { InvoicePrint } from "@/components/invoice-print";
import { usePosData, type Sale } from "@/components/pos-data-provider";
import { useReceiptSettings } from "@/components/receipt-settings-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Ban,
  Edit2,
  MoreVertical,
  Printer,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusMeta: Record<
  NonNullable<Sale["status"]>,
  { label: string; badgeVariant: "default" | "secondary" | "destructive" }
> = {
  completed: { label: "Completed", badgeVariant: "default" },
  voided: { label: "Voided", badgeVariant: "destructive" },
  refunded: { label: "Refunded", badgeVariant: "secondary" },
};

const dateFilterOptions = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export default function RecentReceiptsPage() {
  const {
    sales,
    updateSale,
    voidSale,
    deleteSale,
  } = usePosData();
  const { settings } = useReceiptSettings();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("30");
  const [rowsPerPage, setRowsPerPage] = useState<string>("10");
  const [page, setPage] = useState(0);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Sale | null>(null);
  const [voidTarget, setVoidTarget] = useState<Sale | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, dateFilter, rowsPerPage]);

  const filteredSales = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const limitDays = dateFilter === "all" ? null : Number(dateFilter);
    const cutoffDate =
      limitDays && Number.isFinite(limitDays)
        ? subDays(new Date(), limitDays)
        : null;

    return [...sales]
      .filter((sale) => {
        if (!query) return true;
        const receiptNumber = buildReceiptNumber(sale);
        const haystack = [
          sale.customerName,
          sale.customerEmail,
          sale.customerPhone,
          sale.paymentMethod,
          sale.notes,
          receiptNumber,
          sale.id,
          ...sale.items.map(
            (item) =>
              item.product?.name ||
              item.productId ||
              (typeof item.price === "number" ? item.price.toString() : "")
          ),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .filter((sale) => {
        if (statusFilter === "all") return true;
        const saleStatus = sale.status || "completed";
        return saleStatus === statusFilter;
      })
      .filter((sale) => {
        if (!cutoffDate) return true;
        const saleDate = new Date(sale.date);
        return saleDate >= cutoffDate;
      })
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, [sales, searchQuery, statusFilter, dateFilter]);

  const numericRows = Number(rowsPerPage) || 10;
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / numericRows));
  const paginatedSales = filteredSales.slice(
    page * numericRows,
    page * numericRows + numericRows
  );

  const currencySymbol = settings?.currencySymbol || "$";

  const openInvoice = (sale: Sale) => {
    setSelectedSale(sale);
    setIsInvoiceOpen(true);
  };

  const closeInvoice = () => {
    setIsInvoiceOpen(false);
    setSelectedSale(null);
  };

  const handleEditSave = async (
    saleId: string,
    updates: Partial<Sale>
  ) => {
    await updateSale(saleId, updates);
    setEditTarget(null);
  };

  const handleVoid = async (saleId: string, reason?: string) => {
    await voidSale(saleId, reason);
    setVoidTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteSale(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Recent Receipts
        </h1>
        <p className="text-muted-foreground">
          Review, edit, void, or print receipts from recent sales.
        </p>
      </div>

      <Card>
        <CardHeader className="gap-4 space-y-0 md:flex md:items-center md:justify-between">
          {/* <CardTitle>Receipt Activity</CardTitle> */}
          <div className="w-full space-y-3 md:flex md:flex-1 md:items-center md:justify-end md:gap-3 md:space-y-0">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search receipt, customer, or notes..."
              className="w-full md:w-64"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="voided">Voided</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="md:w-40">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                {dateFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                      No receipts match the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSales.map((sale) => {
                    const status = sale.status || "completed";
                    const statusInfo = statusMeta[status];
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {buildReceiptNumber(sale)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(sale.date), "PPp")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">
                              {sale.customerName || "Walk-in customer"}
                            </p>
                            {sale.customerPhone && (
                              <p className="text-muted-foreground text-xs">
                                {sale.customerPhone}
                              </p>
                            )}
                            {sale.customerEmail && (
                              <p className="text-muted-foreground text-xs">
                                {sale.customerEmail}
                              </p>
                            )}
                          </div>
                        </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="line-clamp-2">
                            {sale.items
                              .map(
                                  (item) =>
                                    item.product?.name ||
                                    item.productId ||
                                    "Item"
                                )
                              .join(", ")}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span>
                              {sale.items.length}{" "}
                              {sale.items.length === 1 ? "item" : "items"}
                            </span>
                            <span aria-hidden="true">•</span>
                            <span>{format(new Date(sale.date), "PP")}</span>
                          </p>
                        </div>
                      </TableCell>
                        <TableCell>
                          <div className="text-sm capitalize">
                            {sale.paymentMethod}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {currencySymbol}
                          {sale.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusInfo?.badgeVariant || "secondary"}
                            className={cn(
                              status === "voided" && "bg-destructive/10 text-destructive"
                            )}
                          >
                            {statusInfo?.label || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Open receipt actions">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => openInvoice(sale)}
                                className="gap-2"
                              >
                                <Printer className="h-4 w-4" />
                                View / Print
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => setEditTarget(sale)}
                                className="gap-2"
                              >
                                <Edit2 className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={sale.status === "voided"}
                                onSelect={() => setVoidTarget(sale)}
                                className="gap-2"
                              >
                                <Ban className="h-4 w-4" />
                                Void
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive"
                                onSelect={() => setDeleteTarget(sale)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>
              Showing{" "}
              <span className="font-medium text-foreground">
                {paginatedSales.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {filteredSales.length}
              </span>{" "}
              receipts
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span>
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages - 1))
                  }
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSale && (
        <InvoicePrint
          sale={selectedSale}
          isOpen={isInvoiceOpen}
          onClose={closeInvoice}
        />
      )}

      <EditReceiptDialog
        sale={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleEditSave}
      />

      <VoidReceiptDialog
        sale={voidTarget}
        onClose={() => setVoidTarget(null)}
        onConfirm={handleVoid}
      />

      <DeleteReceiptDialog
        sale={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function buildReceiptNumber(sale: Sale): string {
  if (sale.receiptNumber) return sale.receiptNumber;
  const dateStr = format(new Date(sale.date), "yyMMdd");
  const shortId = sale.id.slice(0, 4).toUpperCase();
  return `${dateStr}-${shortId}`;
}

function EditReceiptDialog({
  sale,
  onClose,
  onSave,
}: {
  sale: Sale | null;
  onClose: () => void;
  onSave: (saleId: string, updates: Partial<Sale>) => Promise<void>;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (sale) {
      setCustomerName(sale.customerName || "");
      setCustomerEmail(sale.customerEmail || "");
      setCustomerPhone(sale.customerPhone || "");
      setPaymentMethod(sale.paymentMethod || "cash");
      setNotes(sale.notes || "");
    }
  }, [sale]);

  const handleSave = async () => {
    if (!sale) return;
    try {
      setIsSaving(true);
      await onSave(sale.id, {
        customerName: customerName.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={!!sale} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Receipt</DialogTitle>
          <DialogDescription>
            Update customer details or payment method for this receipt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Customer Name</Label>
            <Input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit">Credit Card</SelectItem>
                <SelectItem value="mobile">Mobile Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VoidReceiptDialog({
  sale,
  onClose,
  onConfirm,
}: {
  sale: Sale | null;
  onClose: () => void;
  onConfirm: (saleId: string, reason?: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);

  useEffect(() => {
    setReason("");
  }, [sale]);

  const handleConfirm = async () => {
    if (!sale) return;
    try {
      setIsVoiding(true);
      await onConfirm(sale.id, reason.trim() || undefined);
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <Dialog open={!!sale} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void Receipt</DialogTitle>
          <DialogDescription>
            Voiding a receipt will restock all items and keep a record of this transaction.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Label>Reason for void</Label>
          <Textarea
            rows={3}
            placeholder="Optional reason for voiding..."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isVoiding}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isVoiding}
          >
            {isVoiding ? "Voiding..." : "Confirm Void"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteReceiptDialog({
  sale,
  onClose,
  onConfirm,
}: {
  sale: Sale | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!sale) return;
    try {
      setIsDeleting(true);
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={!!sale} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete receipt?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will restock the items and permanently remove this receipt.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
