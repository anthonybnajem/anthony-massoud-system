"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Users, Trash2, MoreVertical, Eye, CheckCircle, Banknote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePosData } from "@/components/pos-data-provider";
import { useReceiptSettings } from "@/components/receipt-settings-provider";
import { useDiscount } from "@/components/discount-provider";
import { useLanguage } from "@/components/language-provider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { buildCustomersFromSales, WALK_IN_CUSTOMER_NAME, type CustomerSummary } from "./utils";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CustomersPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const {
    sales,
    customers: customerProfiles,
    addCustomerProfile,
    removeCustomerProfile,
    hideCustomerIdentity,
    updateSale,
  } = usePosData();
  const { settings } = useReceiptSettings();
  const { discounts } = useDiscount();
  const currencySymbol = settings?.currencySymbol || "$";
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerLocation, setNewCustomerLocation] = useState("");
  const [newCustomerNotes, setNewCustomerNotes] = useState("");
  const [newCustomerDiscountId, setNewCustomerDiscountId] = useState<
    string | undefined
  >(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<{
    id?: string;
    name: string;
    identity: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
    };
  } | null>(null);
  type PaymentFilter = "all" | "paid" | "unpaid" | "partially_paid";
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [partialPaymentCustomer, setPartialPaymentCustomer] = useState<CustomerSummary | null>(null);
  const [partialPaymentSaleId, setPartialPaymentSaleId] = useState<string>("");
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<string>("");
  const [isPaymentActionLoading, setIsPaymentActionLoading] = useState(false);

  const customers = useMemo(
    () => buildCustomersFromSales(sales, customerProfiles),
    [sales, customerProfiles]
  );
  const discountLookup = useMemo(
    () =>
      discounts.reduce<Record<string, string>>((acc, discount) => {
        acc[discount.id] = discount.name;
        return acc;
      }, {}),
    [discounts]
  );

  const getCustomerPaymentStatus = (
    customer: (typeof customers)[0]
  ): "paid" | "unpaid" | "partially_paid" => {
    const unpaidSales = customer.sales.filter(
      (s) =>
        s.paymentStatus === "unpaid" || s.paymentStatus === "partially_paid"
    );
    if (unpaidSales.length === 0) return "paid";
    if (customer.sales.some((s) => s.paymentStatus === "partially_paid"))
      return "partially_paid";
    return "unpaid";
  };

  const getUnpaidOrPartialSales = (customer: CustomerSummary) =>
    customer.sales.filter(
      (s) =>
        s.paymentStatus === "unpaid" || s.paymentStatus === "partially_paid"
    );

  const handleMarkAllPaid = async (customer: CustomerSummary) => {
    const toUpdate = getUnpaidOrPartialSales(customer);
    if (toUpdate.length === 0) return;
    try {
      setIsPaymentActionLoading(true);
      for (const sale of toUpdate) {
        await updateSale(sale.id, {
          paymentStatus: "paid",
          amountPaid: sale.total,
        });
      }
      toast({
        title: t("customers.markAllPaidDone"),
        description: t("customers.markAllPaidDoneDesc", { name: customer.name, count: toUpdate.length }),
      });
    } catch (e) {
      toast({
        title: t("common.error"),
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsPaymentActionLoading(false);
    }
  };

  const openPartialPaymentDialog = (customer: CustomerSummary) => {
    const unpaid = getUnpaidOrPartialSales(customer);
    setPartialPaymentCustomer(customer);
    setPartialPaymentSaleId(unpaid[0]?.id ?? "");
    const first = unpaid[0];
    setPartialPaymentAmount(
      first ? String(first.amountPaid ?? 0) : ""
    );
  };

  const handleSavePartialPayment = async () => {
    if (!partialPaymentCustomer || !partialPaymentSaleId.trim()) return;
    const sale = partialPaymentCustomer.sales.find((s) => s.id === partialPaymentSaleId);
    if (!sale) return;
    const amount = parseFloat(partialPaymentAmount);
    if (Number.isNaN(amount) || amount < 0) {
      toast({
        title: t("common.error"),
        description: t("customers.invalidAmount"),
        variant: "destructive",
      });
      return;
    }
    try {
      setIsPaymentActionLoading(true);
      const isFullyPaid = amount >= sale.total;
      await updateSale(sale.id, {
        paymentStatus: isFullyPaid ? "paid" : "partially_paid",
        amountPaid: amount,
      });
      toast({
        title: t("customers.paymentUpdated"),
        description: isFullyPaid
          ? t("customers.fullyPaid")
          : t("customers.partiallyPaid"),
      });
      setPartialPaymentCustomer(null);
      setPartialPaymentSaleId("");
      setPartialPaymentAmount("");
    } catch (e) {
      toast({
        title: t("common.error"),
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsPaymentActionLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    let list = customers;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((customer) => {
        const discountName = customer.defaultDiscountId
          ? discountLookup[customer.defaultDiscountId]?.toLowerCase()
          : "";
        return (
          customer.name.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query) ||
          customer.phone?.toLowerCase().includes(query) ||
          (discountName && discountName.includes(query))
        );
      });
    }
    if (paymentFilter !== "all") {
      list = list.filter(
        (c) => getCustomerPaymentStatus(c) === paymentFilter
      );
    }
    return list;
  }, [customers, searchQuery, paymentFilter, discountLookup]);

  return (
    <div className="space-y-6 overflow-hidden min-w-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          {t("customers.title")}
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          {t("customers.subtitle")}
        </p>
      </div>

      <Card className="border-2">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardDescription>
                {filteredCustomers.length}{" "}
                {filteredCustomers.length === 1 ? t("customers.customer") : t("customers.customers")} {t("customers.found")}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Input
                placeholder={t("customers.searchPlaceholder")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="sm:max-w-xs"
              />
              <Button onClick={() => setIsAddCustomerOpen(true)}>
                {t("customers.addCustomer")}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">{t("customers.payment")}:</span>
            <Button
              variant={paymentFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setPaymentFilter("all")}
            >
              {t("customers.filterAll")}
            </Button>
            <Button
              variant={paymentFilter === "paid" ? "default" : "outline"}
              size="sm"
              onClick={() => setPaymentFilter("paid")}
            >
              {t("customers.paid")}
            </Button>
            <Button
              variant={paymentFilter === "partially_paid" ? "default" : "outline"}
              size="sm"
              onClick={() => setPaymentFilter("partially_paid")}
            >
              {t("customers.partiallyPaid")}
            </Button>
            <Button
              variant={paymentFilter === "unpaid" ? "default" : "outline"}
              size="sm"
              onClick={() => setPaymentFilter("unpaid")}
            >
              {t("customers.unpaid")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>{t("customers.noCustomersYet")}</EmptyTitle>
                <EmptyDescription>
                  {t("customers.noCustomersDesc")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("customers.customer")}</TableHead>
                    <TableHead>{t("customers.contact")}</TableHead>
                    <TableHead>{t("customers.location")}</TableHead>
                    <TableHead>{t("customers.discount")}</TableHead>
                    <TableHead>{t("customers.totalSpent")}</TableHead>
                    <TableHead>{t("customers.purchases")}</TableHead>
                    <TableHead>{t("customers.payment")}</TableHead>
                    <TableHead>{t("customers.lastPurchase")}</TableHead>
                    <TableHead className="text-end">{t("customers.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-semibold">
                        {customer.name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {customer.email || "—"}
                          <br />
                          <span className="text-muted-foreground">
                            {customer.phone || t("customers.noPhone")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {customer.location || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {                          customer.defaultDiscountId
                            ? discountLookup[customer.defaultDiscountId] ||
                              t("customers.discountRemoved")
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {currencySymbol}
                        {customer.totalSpent.toFixed(2)}
                      </TableCell>
                      <TableCell>{customer.purchaseCount}</TableCell>
                      <TableCell>
                        {(() => {
                          const status = getCustomerPaymentStatus(customer);
                          if (status === "paid") {
                            return (
                              <Badge
                                variant="outline"
                                className="w-fit font-normal text-green-700 border-green-300 bg-green-50"
                              >
                                {t("customers.paid")}
                              </Badge>
                            );
                          }
                          if (status === "partially_paid") {
                            return (
                              <Badge
                                variant="outline"
                                className="w-fit font-normal text-amber-700 border-amber-300 bg-amber-50"
                              >
                                {t("customers.partiallyPaid")}
                              </Badge>
                            );
                          }
                          return (
                            <Badge
                              variant="outline"
                              className="w-fit font-normal text-red-700 border-red-300 bg-red-50"
                            >
                              {t("customers.unpaid")}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {format(customer.lastPurchase, "MMM dd, yyyy")}
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
                                href={`/customers/${encodeURIComponent(customer.id)}`}
                                className="flex items-center"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {t("customers.view")}
                              </Link>
                            </DropdownMenuItem>
                            {getUnpaidOrPartialSales(customer).length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleMarkAllPaid(customer)}
                                  disabled={isPaymentActionLoading}
                                  className="text-green-700 focus:text-green-700"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  {t("customers.markAllPaid")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openPartialPaymentDialog(customer)}
                                  disabled={isPaymentActionLoading}
                                  className="text-amber-700 focus:text-amber-700"
                                >
                                  <Banknote className="mr-2 h-4 w-4" />
                                  {t("customers.recordPartialPayment")}
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                setCustomerToDelete({
                                  id: customer.profileId,
                                  name: customer.name || WALK_IN_CUSTOMER_NAME,
                                  identity: {
                                    name: customer.name,
                                    email: customer.email,
                                    phone: customer.phone,
                                    location: customer.location,
                                  },
                                })
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("common.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!partialPaymentCustomer}
        onOpenChange={(open) => {
          if (!open) {
            setPartialPaymentCustomer(null);
            setPartialPaymentSaleId("");
            setPartialPaymentAmount("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("customers.recordPartialPayment")}</DialogTitle>
            <DialogDescription>
              {partialPaymentCustomer &&
                t("customers.recordPartialPaymentDesc", { name: partialPaymentCustomer.name })}
            </DialogDescription>
          </DialogHeader>
          {partialPaymentCustomer && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("customers.selectReceipt")}</Label>
                <Select
                  value={partialPaymentSaleId}
                  onValueChange={(id) => {
                    setPartialPaymentSaleId(id);
                    const sale = partialPaymentCustomer.sales.find((s) => s.id === id);
                    if (sale) setPartialPaymentAmount(String(sale.amountPaid ?? 0));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getUnpaidOrPartialSales(partialPaymentCustomer).map((sale) => (
                      <SelectItem key={sale.id} value={sale.id}>
                        #{sale.id.slice(0, 8)} — {currencySymbol}
                        {sale.total.toFixed(2)}
                        {sale.amountPaid != null && sale.amountPaid > 0
                          ? ` (${t("customers.paidSoFar")}: ${currencySymbol}${sale.amountPaid.toFixed(2)})`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("customers.amountPaid")}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={partialPaymentAmount}
                  onChange={(e) => setPartialPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
                {partialPaymentSaleId && (() => {
                  const sale = partialPaymentCustomer.sales.find((s) => s.id === partialPaymentSaleId);
                  const total = sale?.total ?? 0;
                  return (
                    <p className="text-xs text-muted-foreground">
                      {t("customers.totalForReceipt")}: {currencySymbol}
                      {total.toFixed(2)}
                    </p>
                  );
                })()}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPartialPaymentCustomer(null);
                setPartialPaymentSaleId("");
                setPartialPaymentAmount("");
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSavePartialPayment} disabled={isPaymentActionLoading}>
              {isPaymentActionLoading ? t("customers.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("customers.addCustomerTitle")}</DialogTitle>
            <DialogDescription>
              {t("customers.saveCustomerDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">{t("checkout.nameLabel")}</Label>
              <Input
                id="new-name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder={t("customers.namePlaceholder")}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-email">{t("checkout.emailLabel")}</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder={t("customers.emailPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-phone">{t("checkout.phoneLabel")}</Label>
                <Input
                  id="new-phone"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder={t("customers.phonePlaceholder")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-location">{t("checkout.locationLabel")}</Label>
              <Input
                id="new-location"
                value={newCustomerLocation}
                onChange={(e) => setNewCustomerLocation(e.target.value)}
                placeholder={t("customers.cityAddress")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-discount">{t("customers.defaultDiscount")}</Label>
              <Select
                value={newCustomerDiscountId ?? "none"}
                onValueChange={(value) =>
                  setNewCustomerDiscountId(
                    value === "none" ? undefined : value
                  )
                }
              >
                <SelectTrigger id="new-discount">
                  <SelectValue placeholder={t("customers.noDiscountPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("customers.noDiscountPlaceholder")}</SelectItem>
                  {discounts.length === 0 ? (
                    <SelectItem value="placeholder" disabled>
                      {t("customers.createDiscountFirst")}
                    </SelectItem>
                  ) : (
                    discounts.map((discount) => (
                      <SelectItem key={discount.id} value={discount.id}>
                        {discount.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-notes">{t("customers.notes")}</Label>
              <Textarea
                id="new-notes"
                value={newCustomerNotes}
                onChange={(e) => setNewCustomerNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddCustomerOpen(false)}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </Button>
              <Button
                onClick={async () => {
                  if (!newCustomerName.trim()) {
                    return;
                  }
                  try {
                    setIsSaving(true);
                    await addCustomerProfile({
                      name: newCustomerName,
                      email: newCustomerEmail,
                      phone: newCustomerPhone,
                      location: newCustomerLocation,
                      notes: newCustomerNotes,
                      defaultDiscountId: newCustomerDiscountId,
                    });
                    setNewCustomerName("");
                    setNewCustomerEmail("");
                    setNewCustomerPhone("");
                    setNewCustomerLocation("");
                    setNewCustomerNotes("");
                    setNewCustomerDiscountId(undefined);
                    setIsAddCustomerOpen(false);
                  } finally {
                    setIsSaving(false);
                  }
                }}
              disabled={isSaving || !newCustomerName.trim()}
            >
              {isSaving ? t("customers.saving") : t("customers.saveCustomer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!customerToDelete}
        onOpenChange={() => setCustomerToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("customers.deleteCustomerConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("customers.deleteConfirmBody").replace("{name}", customerToDelete?.name || WALK_IN_CUSTOMER_NAME)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isSaving}
              onClick={async () => {
                if (!customerToDelete) return;
                setIsSaving(true);
                try {
                  if (customerToDelete.id) {
                    await removeCustomerProfile(customerToDelete.id);
                  } else {
                    await hideCustomerIdentity(customerToDelete.identity);
                  }
                  setCustomerToDelete(null);
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
