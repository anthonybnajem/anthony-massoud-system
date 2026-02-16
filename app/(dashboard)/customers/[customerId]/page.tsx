"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Users, UserCircle2 } from "lucide-react";
import { format } from "date-fns";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { buildCustomersFromSales } from "../utils";

export default function CustomerDetailPage() {
  const params = useParams();
  const customerIdParam = decodeURIComponent(
    (params?.customerId as string) || ""
  );
  const { sales } = usePosData();
  const { settings } = useReceiptSettings();
  const currencySymbol = settings?.currencySymbol || "$";

  const customers = useMemo(() => buildCustomersFromSales(sales), [sales]);
  const customer = customers.find((c) => c.id === customerIdParam);

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/customers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Link>
          </Button>
        </div>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Customer not found</EmptyTitle>
            <EmptyDescription>
              We couldn&apos;t find the customer you were looking for.
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
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {customer.name}
          </h1>
          <p className="text-muted-foreground">
            {customer.email || "No email saved"} •{" "}
            {customer.phone || "No phone saved"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {currencySymbol}
              {customer.totalSpent.toFixed(2)}
            </p>
            <CardDescription>All recorded purchases</CardDescription>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customer.purchaseCount}</p>
            <CardDescription>Receipts tied to this customer</CardDescription>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Purchase</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {format(customer.lastPurchase, "MMM dd, yyyy")}
            </p>
            <CardDescription>Most recent visit</CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>
            {customer.sales.length}{" "}
            {customer.sales.length === 1 ? "receipt" : "receipts"} recorded
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {customer.sales.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserCircle2 className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>No purchase history</EmptyTitle>
                <EmptyDescription>
                  Once this customer completes a sale, it will show up here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            customer.sales.map((sale) => (
              <Link
                key={sale.id}
                href={`/receipts/${encodeURIComponent(sale.id)}`}
                className="rounded-lg border p-4 shadow-sm transition hover:border-primary/50 hover:bg-primary/5 block"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      Receipt #{sale.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(sale.date), "PPpp")} •{" "}
                      {sale.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {currencySymbol}
                      {sale.total.toFixed(2)}
                    </p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {sale.items.length}{" "}
                      {sale.items.length === 1 ? "item" : "items"}
                    </Badge>
                  </div>
                </div>
                {sale.notes && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Notes: {sale.notes}
                  </p>
                )}
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
