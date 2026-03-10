import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import {
  User,
  Mail,
  Phone,
  Users,
  ChevronsUpDown,
  Plus,
  Minus,
  Percent,
} from "lucide-react";
import type { CustomerSummary } from "@/app/(dashboard)/customers/utils";
import type { CustomerProject } from "@/components/pos-data-provider";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandInput,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Discount } from "@/lib/db";

interface CustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerEmail: string;
  setCustomerEmail: (email: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  customerLocation: string;
  setCustomerLocation: (location: string) => void;
  saveCustomerInfo: () => void;
  existingCustomers?: CustomerSummary[];
  onSaveProfile?: (details: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    defaultDiscountId?: string;
  }) => Promise<void>;
  availableDiscounts?: Discount[];
  onCustomerSelect?: (customer: CustomerSummary) => void;
  selectedCustomerId?: string;
  onCustomerIdChange?: (customerId: string) => void;
  selectedProjectId?: string;
  onProjectIdChange?: (projectId: string) => void;
  projects?: CustomerProject[];
  onAddProject?: (project: {
    customerId: string;
    name: string;
    location?: string;
    notes?: string;
  }) => Promise<unknown>;
  showProjects?: boolean;
}

export default function CustomerDialog({
  isOpen,
  onClose,
  customerName,
  setCustomerName,
  customerEmail,
  setCustomerEmail,
  customerPhone,
  setCustomerPhone,
  customerLocation,
  setCustomerLocation,
  saveCustomerInfo,
  existingCustomers = [],
  onSaveProfile,
  availableDiscounts = [],
  onCustomerSelect,
  selectedCustomerId = "",
  onCustomerIdChange,
  selectedProjectId = "",
  onProjectIdChange,
  projects = [],
  onAddProject,
  showProjects = false,
}: CustomerDialogProps) {
  const { t } = useLanguage();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileEmail, setNewProfileEmail] = useState("");
  const [newProfilePhone, setNewProfilePhone] = useState("");
  const [newProfileLocation, setNewProfileLocation] = useState("");
  const [newProfileDiscountId, setNewProfileDiscountId] = useState<
    string | undefined
  >(undefined);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);

  const handleSelectCustomer = (customer: CustomerSummary) => {
    setCustomerName(customer.name || "");
    setCustomerEmail(customer.email || "");
    setCustomerPhone(customer.phone || "");
    setCustomerLocation(customer.location || "");
    setIsSelectorOpen(false);
    onCustomerIdChange?.(customer.profileId || "");
    onProjectIdChange?.("");
    setIsCreatingProject(false);
    setNewProjectName("");
    onCustomerSelect?.(customer);
  };

  const handleCreateProject = async () => {
    if (!selectedCustomerId || !newProjectName.trim() || !onAddProject) {
      setIsCreatingProject(false);
      return;
    }
    try {
      setIsSavingProject(true);
      await onAddProject({
        customerId: selectedCustomerId,
        name: newProjectName.trim(),
      });
      setNewProjectName("");
      setIsCreatingProject(false);
    } finally {
      setIsSavingProject(false);
    }
  };

  const openCreateProfile = () => {
    setNewProfileName(customerName || "");
    setNewProfileEmail(customerEmail || "");
    setNewProfilePhone(customerPhone || "");
    setNewProfileLocation(customerLocation || "");
    setNewProfileDiscountId(undefined);
    setIsCreatingProfile(true);
  };

  const handleCreateProfile = async () => {
    if (!onSaveProfile || !newProfileName.trim()) {
      setIsCreatingProfile(false);
      return;
    }

    try {
      setIsSavingProfile(true);
      await onSaveProfile({
        name: newProfileName.trim(),
        email: newProfileEmail.trim() || undefined,
        phone: newProfilePhone.trim() || undefined,
        location: newProfileLocation.trim() || undefined,
        defaultDiscountId: newProfileDiscountId || undefined,
      });
      setCustomerName(newProfileName.trim());
      setCustomerEmail(newProfileEmail.trim());
      setCustomerPhone(newProfilePhone.trim());
      setCustomerLocation(newProfileLocation.trim());
      setIsCreatingProfile(false);
      setIsSelectorOpen(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const selectedLabel =
    customerName ||
    customerEmail ||
    customerPhone ||
    customerLocation ||
    t("checkout.selectCustomer");

  const hasSavedCustomers = existingCustomers.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("checkout.customerInfo")}</DialogTitle>
          <DialogDescription>
            {t("checkout.customerInfoDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {(hasSavedCustomers || onSaveProfile) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                {t("checkout.savedCustomers")}
              </Label>
              <div className="flex items-center gap-2">
                <Link
                  href="/customers"
                  className="text-xs text-primary hover:underline"
                  onClick={onClose}
                >
                  {t("checkout.manage")}
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    isCreatingProfile ? setIsCreatingProfile(false) : openCreateProfile()
                  }
                  title={isCreatingProfile ? t("common.cancel") : t("checkout.createNewCustomer")}
                  disabled={!onSaveProfile}
                >
                  {isCreatingProfile ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {hasSavedCustomers ? (
              <div className="flex items-center gap-2">
                <Popover open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isSelectorOpen}
                      className="flex-1 justify-between"
                    >
                      <span className="truncate text-start">{selectedLabel}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[360px] p-0">
                    <Command>
                      <CommandInput placeholder={t("customers.searchPlaceholder")} />
                      <CommandEmpty>{t("checkout.noCustomersFound")}</CommandEmpty>
                      <CommandGroup>
                        {existingCustomers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={`${customer.name} ${customer.email ?? ""} ${customer.phone ?? ""} ${customer.location ?? ""}`}
                            onSelect={() => handleSelectCustomer(customer)}
                            className="flex flex-col items-start gap-0.5"
                          >
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {customer.email ||
                                customer.phone ||
                                customer.location ||
                                t("checkout.noContactData")}
                            </span>
                            {customer.defaultDiscountId && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Percent className="h-3 w-3" />
                                {t("checkout.discountAssigned")}
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("checkout.noSavedCustomersYet")}
              </p>
            )}
            {showProjects && selectedCustomerId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>{t("checkout.project")}</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setIsCreatingProject((prev) => !prev)}
                  >
                    {isCreatingProject ? t("common.cancel") : t("checkout.addProject")}
                  </Button>
                </div>
                <Select
                  value={selectedProjectId || "none"}
                  onValueChange={(value) =>
                    onProjectIdChange?.(value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("checkout.chooseProject")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("checkout.noProject")}</SelectItem>
                    {projects.length === 0 ? (
                      <SelectItem value="no-projects" disabled>
                        {t("checkout.noProjectsForCustomer")}
                      </SelectItem>
                    ) : (
                      projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {isCreatingProject && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder={t("checkout.projectName")}
                    />
                    <Button
                      type="button"
                      onClick={handleCreateProject}
                      disabled={isSavingProject || !newProjectName.trim()}
                    >
                      {isSavingProject ? t("checkout.saving") : t("common.save")}
                    </Button>
                  </div>
                )}
              </div>
            )}
        {isCreatingProfile && <div className="grid gap-2">
                  <Label htmlFor="new-profile-name">{t("checkout.createNewCustomer")}</Label>
                  </div>}
            {isCreatingProfile && (
              <div className="rounded-md border border-dashed p-3 space-y-2">
                <div className="grid gap-2">
                  <Label htmlFor="new-profile-name">{t("checkout.nameLabel")}</Label>
                  <Input
                    id="new-profile-name"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder={t("customers.namePlaceholder")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-profile-email">{t("checkout.emailLabel")}</Label>
                  <Input
                    id="new-profile-email"
                    type="email"
                    value={newProfileEmail}
                    onChange={(e) => setNewProfileEmail(e.target.value)}
                    placeholder={t("customers.emailPlaceholder")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-profile-phone">{t("checkout.phoneLabel")}</Label>
                  <Input
                    id="new-profile-phone"
                    value={newProfilePhone}
                    onChange={(e) => setNewProfilePhone(e.target.value)}
                    placeholder={t("customers.phonePlaceholder")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-profile-location">{t("checkout.locationLabel")}</Label>
                  <Input
                    id="new-profile-location"
                    value={newProfileLocation}
                    onChange={(e) => setNewProfileLocation(e.target.value)}
                    placeholder={t("customers.cityAddress")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-profile-discount">{t("customers.defaultDiscount")}</Label>
                  <Select
                    value={newProfileDiscountId ?? "none"}
                    onValueChange={(value) =>
                      setNewProfileDiscountId(
                        value === "none" ? undefined : value
                      )
                    }
                  >
                    <SelectTrigger id="new-profile-discount">
                      <SelectValue placeholder={t("checkout.chooseDiscount")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("checkout.noDiscount")}</SelectItem>
                      {availableDiscounts.length === 0 ? (
                        <SelectItem value="placeholder" disabled>
                          {t("checkout.createDiscountsToReuse")}
                        </SelectItem>
                      ) : (
                        availableDiscounts.map((discount) => (
                          <SelectItem key={discount.id} value={discount.id}>
                            {discount.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingProfile(false)}
                    disabled={isSavingProfile}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={handleCreateProfile}
                    disabled={
                      isSavingProfile || !newProfileName.trim() || !onSaveProfile
                    }
                  >
                    {isSavingProfile ? t("checkout.saving") : t("customers.saveCustomer")}
                  </Button>
                </div>
              </div>
            )}
          </div>
          )}
        
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={saveCustomerInfo}>{t("checkout.continue")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
