"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, Users, UserCircle2, FolderKanban, Pencil, Eye } from "lucide-react";
import { format } from "date-fns";
import { usePosData } from "@/components/pos-data-provider";
import { useReceiptSettings } from "@/components/receipt-settings-provider";
import { useDiscount } from "@/components/discount-provider";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { buildCustomersFromSales } from "../utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CustomerDetailPage() {
  const params = useParams();
  const customerIdParam = decodeURIComponent(
    (params?.customerId as string) || ""
  );
  const {
    sales,
    customers: customerProfiles,
    projects,
    addCustomerProject,
    updateCustomerProject,
    updateSale,
    updateCustomerProfile,
  } = usePosData();
  const { settings } = useReceiptSettings();
  const { discounts } = useDiscount();
  const { t } = useLanguage();
  const currencySymbol = settings?.currencySymbol || "$";

  const customers = useMemo(
    () => buildCustomersFromSales(sales, customerProfiles),
    [sales, customerProfiles]
  );
  const customer = customers.find((c) => c.id === customerIdParam);
  const discountLookup = useMemo(
    () =>
      discounts.reduce<Record<string, string>>((acc, discount) => {
        acc[discount.id] = discount.name;
        return acc;
      }, {}),
    [discounts]
  );
  const assignedDiscountLabel = customer?.defaultDiscountId
    ? discountLookup[customer.defaultDiscountId] || t("customers.discountRemoved")
    : t("customers.noDiscountPlaceholder");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [pendingLocation, setPendingLocation] = useState("");
  const [pendingDiscountId, setPendingDiscountId] = useState<
    string | undefined
  >(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectNotes, setProjectNotes] = useState("");

  useEffect(() => {
    if (customer && isEditOpen) {
      setPendingName(customer.name || "");
      setPendingEmail(customer.email || "");
      setPendingPhone(customer.phone || "");
      setPendingLocation(customer.location || "");
      setPendingDiscountId(customer.defaultDiscountId || undefined);
    }
  }, [customer, isEditOpen]);

  const handleSaveCustomer = async () => {
    if (!customer) return;
    try {
      setIsSaving(true);
      await Promise.all(
        customer.sales.map((sale) =>
          updateSale(sale.id, {
            customerName: pendingName.trim() || undefined,
            customerEmail: pendingEmail.trim() || undefined,
            customerPhone: pendingPhone.trim() || undefined,
            customerLocation: pendingLocation.trim() || undefined,
            discountId: pendingDiscountId || sale.discountId,
          })
        )
      );
      if (customer.profileId) {
        const profileRecord = customerProfiles.find(
          (p) => p.id === customer.profileId
        );
        if (profileRecord) {
          await updateCustomerProfile({
            ...profileRecord,
            name: pendingName.trim() || profileRecord.name,
            email: pendingEmail.trim() || undefined,
            phone: pendingPhone.trim() || undefined,
            location: pendingLocation.trim() || undefined,
            defaultDiscountId: pendingDiscountId || undefined,
          });
        }
      }
      setIsEditOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const totalAmountNotPaid = useMemo(() => {
    if (!customer) return 0;
    return customer.sales.reduce((sum, sale) => {
      if (sale.paymentStatus === "paid" || sale.paymentStatus == null) return sum;
      const paid = sale.paymentStatus === "partially_paid" ? (sale.amountPaid ?? 0) : 0;
      return sum + (sale.total - paid);
    }, 0);
  }, [customer]);

  const customerProfileId = customer?.profileId;
  const customerProjects = useMemo(
    () =>
      customerProfileId
        ? projects.filter((project) => project.customerId === customerProfileId)
        : [],
    [projects, customerProfileId]
  );

  const resetProjectForm = () => {
    setProjectId("");
    setProjectName("");
    setProjectLocation("");
    setProjectNotes("");
    setIsEditingProject(false);
  };

  const openAddProject = () => {
    resetProjectForm();
    setIsProjectDialogOpen(true);
  };

  const openEditProject = (id: string) => {
    const project = customerProjects.find((item) => item.id === id);
    if (!project) return;
    setProjectId(project.id);
    setProjectName(project.name);
    setProjectLocation(project.location || "");
    setProjectNotes(project.notes || "");
    setIsEditingProject(true);
    setIsProjectDialogOpen(true);
  };

  const handleSaveProject = async () => {
    if (!customerProfileId || !projectName.trim()) return;
    try {
      setIsSaving(true);
      if (isEditingProject) {
        const existing = customerProjects.find((item) => item.id === projectId);
        if (!existing) return;
        await updateCustomerProject({
          ...existing,
          name: projectName,
          location: projectLocation || undefined,
          notes: projectNotes || undefined,
        });
      } else {
        await addCustomerProject({
          customerId: customerProfileId,
          name: projectName,
          location: projectLocation || undefined,
          notes: projectNotes || undefined,
        });
      }
      setIsProjectDialogOpen(false);
      resetProjectForm();
    } finally {
      setIsSaving(false);
    }
  };

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/customers">
              <ArrowLeft className="me-2 h-4 w-4" />
              {t("common.back")}
            </Link>
          </Button>
        </div>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>{t("customers.customerNotFound")}</EmptyTitle>
            <EmptyDescription>
              {t("customers.customerNotFoundDesc")}
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
          <Link href="/customers">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t("common.back")}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {customer.name}
          </h1>
          <p className="text-muted-foreground">
            {customer.email || t("customers.noEmailSaved")} •{" "}
            {customer.phone || t("customers.noPhoneSaved")} •{" "}
            {customer.location || t("customers.noLocationSaved")}
          </p>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
          {t("customers.editCustomer")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("customers.totalSpent")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {currencySymbol}
              {customer.totalSpent.toFixed(2)}
            </p>
            <CardDescription>{t("customers.allRecordedPurchases")}</CardDescription>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("customers.amountNotPaid")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalAmountNotPaid > 0 ? "text-amber-700" : ""}`}>
              {currencySymbol}
              {totalAmountNotPaid.toFixed(2)}
            </p>
            <CardDescription>{t("customers.totalUnpaidBalance")}</CardDescription>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("customers.purchases")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customer.purchaseCount}</p>
            <CardDescription>{t("customers.receiptsTiedToCustomer")}</CardDescription>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("customers.lastPurchase")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {format(customer.lastPurchase, "MMM dd, yyyy")}
            </p>
            <CardDescription>{t("customers.mostRecentVisit")}</CardDescription>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("customers.location")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {customer.location || t("customers.notProvided")}
            </p>
            <CardDescription>{t("customers.savedCustomerLocation")}</CardDescription>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("customers.preferredDiscount")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{assignedDiscountLabel}</p>
            <CardDescription>{t("customers.appliedDuringCheckout")}</CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              {t("customers.projects")}
            </CardTitle>
            <CardDescription>
              {t("customers.projectsUnderProfile")}
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={openAddProject}
            disabled={!customerProfileId}
          >
            {t("customers.addProject")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {!customerProfileId ? (
            <p className="text-sm text-muted-foreground">
              {t("customers.saveProfileFirst")}
            </p>
          ) : customerProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("customers.noProjectsYet")}
            </p>
          ) : (
            customerProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-lg border p-4 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <p className="font-semibold">{project.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {project.location || t("customers.noLocationSaved")}
                  </p>
                  {project.notes && (
                    <p className="text-xs text-muted-foreground">
                      {project.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/projects/${encodeURIComponent(project.id)}`}>
                      <Eye className="me-2 h-4 w-4" />
                      {t("customers.view")}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditProject(project.id)}
                  >
                    <Pencil className="me-2 h-4 w-4" />
                    {t("common.edit")}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>{t("customers.purchaseHistory")}</CardTitle>
          <CardDescription>
            {t("customers.receiptsRecorded", { count: customer.sales.length })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {customer.sales.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserCircle2 className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>{t("customers.noPurchaseHistory")}</EmptyTitle>
                <EmptyDescription>
                  {t("customers.onceCustomerCompletesSale")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            customer.sales.map((sale) => {
              const isPaid = sale.paymentStatus === "paid" || sale.paymentStatus == null;
              const paidSoFar = isPaid
                ? sale.total
                : (sale.paymentStatus === "partially_paid"
                    ? sale.amountPaid ?? 0
                    : 0);
              const amountLeft = sale.total - paidSoFar;
              return (
                <Link
                  key={sale.id}
                  href={`/receipts/${encodeURIComponent(sale.id)}`}
                  className="rounded-lg border p-4 shadow-sm transition hover:border-primary/50 hover:bg-primary/5 block"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {t("customers.receiptShort")} #{sale.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(sale.date), "PPpp")}
                      </p>
                      <div className="mt-2 text-xs">
                        <p className="text-muted-foreground">
                          {isPaid ? (
                            <span className="text-green-600 font-medium">
                              {t("customers.fullyPaid")}
                            </span>
                          ) : (
                            <>
                              {t("customers.amountLeft")}:{" "}
                              <span className="font-medium text-amber-700">
                                {currencySymbol}
                                {amountLeft.toFixed(2)}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-semibold">
                        {currencySymbol}
                        {sale.total.toFixed(2)}
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {t("customers.itemsCount", { count: sale.items.length })}
                      </Badge>
                    </div>
                  </div>
                  {sale.notes && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("customers.notes")}: {sale.notes}
                    </p>
                  )}
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("customers.editCustomer")}</DialogTitle>
            <DialogDescription>
              {t("customers.editCustomerDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t("customers.nameLabel")}</Label>
              <Input
                id="edit-name"
                value={pendingName}
                onChange={(e) => setPendingName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">{t("receipts.email")}</Label>
              <Input
                id="edit-email"
                type="email"
                value={pendingEmail}
                onChange={(e) => setPendingEmail(e.target.value)}
              />
            </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">{t("receipts.phone")}</Label>
            <Input
              id="edit-phone"
              value={pendingPhone}
              onChange={(e) => setPendingPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-location">{t("receipts.location")}</Label>
            <Input
              id="edit-location"
              value={pendingLocation}
              onChange={(e) => setPendingLocation(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-discount">{t("customers.preferredDiscount")}</Label>
            <Select
              value={pendingDiscountId ?? "none"}
              onValueChange={(value) =>
                setPendingDiscountId(value === "none" ? undefined : value)
              }
            >
              <SelectTrigger id="edit-discount">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveCustomer} disabled={isSaving}>
              {isSaving ? t("customers.saving") : t("stores.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditingProject ? t("projects.editProject") : t("projects.addProject")}
            </DialogTitle>
            <DialogDescription>
              {isEditingProject
                ? t("projects.editProjectDesc")
                : t("projects.addProjectDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">{t("projects.projectName")}</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder={t("projects.projectNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-location">{t("receipts.location")}</Label>
              <Input
                id="project-location"
                value={projectLocation}
                onChange={(event) => setProjectLocation(event.target.value)}
                placeholder={t("projects.locationPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-notes">{t("customers.notes")}</Label>
              <Textarea
                id="project-notes"
                rows={3}
                value={projectNotes}
                onChange={(event) => setProjectNotes(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProjectDialogOpen(false)}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSaveProject}
              disabled={isSaving || !projectName.trim()}
            >
              {isSaving ? t("customers.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
