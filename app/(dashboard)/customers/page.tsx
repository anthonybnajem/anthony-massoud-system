"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { usePosData } from "@/components/pos-data-provider";
import { useReceiptSettings } from "@/components/receipt-settings-provider";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildCustomersFromSales } from "./utils";

export default function CustomersPage() {
  const { sales, customers: customerProfiles, addCustomerProfile } = usePosData();
  const { settings } = useReceiptSettings();
  const currencySymbol = settings?.currencySymbol || "$";
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerLocation, setNewCustomerLocation] = useState("");
  const [newCustomerNotes, setNewCustomerNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const customers = useMemo(
    () => buildCustomersFromSales(sales, customerProfiles),
    [sales, customerProfiles]
  );

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  return (
    <div className="space-y-6 overflow-hidden min-w-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Customers
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Review every customer that made a purchase and dive into their receipt history.
        </p>
      </div>

      <Card className="border-2">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Customer Directory</CardTitle>
              <CardDescription>
                {filteredCustomers.length}{" "}
                {filteredCustomers.length === 1 ? "customer" : "customers"} found
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Input
                placeholder="Search by name, email, or phone"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="sm:max-w-xs"
              />
              <Button onClick={() => setIsAddCustomerOpen(true)}>
                Add Customer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>No customers yet</EmptyTitle>
                <EmptyDescription>
                  As soon as you add customer details during checkout, they will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Purchases</TableHead>
                    <TableHead>Last Purchase</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                            {customer.phone || "No phone"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {customer.location || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {currencySymbol}
                        {customer.totalSpent.toFixed(2)}
                      </TableCell>
                      <TableCell>{customer.purchaseCount}</TableCell>
                      <TableCell>
                        {format(customer.lastPurchase, "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/customers/${encodeURIComponent(customer.id)}`}
                          >
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>
              Save a customer profile to reuse during checkout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Name</Label>
              <Input
                id="new-name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Customer name"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-phone">Phone</Label>
                <Input
                  id="new-phone"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-location">Location</Label>
              <Input
                id="new-location"
                value={newCustomerLocation}
                onChange={(e) => setNewCustomerLocation(e.target.value)}
                placeholder="City / Address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-notes">Notes</Label>
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
              Cancel
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
                  });
                  setNewCustomerName("");
                  setNewCustomerEmail("");
                  setNewCustomerPhone("");
                  setNewCustomerLocation("");
                  setNewCustomerNotes("");
                  setIsAddCustomerOpen(false);
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving || !newCustomerName.trim()}
            >
              {isSaving ? "Saving..." : "Save Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
