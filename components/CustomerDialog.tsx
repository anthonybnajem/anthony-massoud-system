import { useMemo, useState } from "react";
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
import { User, Mail, Phone, Users } from "lucide-react";
import type { CustomerSummary } from "@/app/(dashboard)/customers/utils";

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
}: CustomerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return existingCustomers.slice(0, 6);
    const query = searchQuery.toLowerCase();
    return existingCustomers
      .filter(
        (customer) =>
          customer.name.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query) ||
          customer.phone?.toLowerCase().includes(query)
      )
      .slice(0, 6);
  }, [existingCustomers, searchQuery]);

  const handleSelectCustomer = (customer: CustomerSummary) => {
    setCustomerName(customer.name || "");
    setCustomerEmail(customer.email || "");
    setCustomerPhone(customer.phone || "");
    setCustomerLocation(customer.location || "");
    setSearchQuery("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customer Information</DialogTitle>
          <DialogDescription>
            Add customer details to this sale.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {existingCustomers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Reuse Customer
                </Label>
                <Link
                  href="/customers"
                  className="text-xs text-primary hover:underline"
                  onClick={onClose}
                >
                  Manage customers
                </Link>
              </div>
              <Input
                placeholder="Search saved customers"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="max-h-36 overflow-y-auto rounded-md border border-dashed p-2">
                {filteredCustomers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No matches. Try a different name or add a new customer below.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className="w-full rounded-md px-2 py-1 text-left text-sm transition hover:bg-primary/10"
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <p className="font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.email ||
                          customer.phone ||
                          customer.location ||
                          "No contact data"}
                      </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="customer-name">Name</Label>
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                id="customer-name"
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customer-email">Email</Label>
            <div className="flex items-center">
              <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                id="customer-email"
                type="email"
                placeholder="customer@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customer-phone">Phone</Label>
            <div className="flex items-center">
              <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                id="customer-phone"
                placeholder="Phone number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customer-location">Location</Label>
            <Input
              id="customer-location"
              placeholder="City / Address / Notes"
              value={customerLocation}
              onChange={(e) => setCustomerLocation(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={saveCustomerInfo}>Save Customer Info</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
