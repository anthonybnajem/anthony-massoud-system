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
import { buildCustomersFromSales } from "./utils";

export default function CustomersPage() {
  const { sales } = usePosData();
  const { settings } = useReceiptSettings();
  const currencySymbol = settings?.currencySymbol || "$";
  const [searchQuery, setSearchQuery] = useState("");

  const customers = useMemo(() => buildCustomersFromSales(sales), [sales]);

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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Customer Directory</CardTitle>
              <CardDescription>
                {filteredCustomers.length}{" "}
                {filteredCustomers.length === 1 ? "customer" : "customers"} found
              </CardDescription>
            </div>
            <Input
              placeholder="Search by name, email, or phone"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="sm:max-w-xs"
            />
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
    </div>
  );
}
