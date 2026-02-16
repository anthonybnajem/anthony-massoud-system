"use client";

import { type Sale } from "@/components/pos-data-provider";

export const WALK_IN_CUSTOMER_NAME = "Walk-in Customer";

export type CustomerSummary = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  totalSpent: number;
  purchaseCount: number;
  lastPurchase: Date;
  sales: Sale[];
};

const normalizeKey = (sale: Sale): string => {
  const normalizedPhone = sale.customerPhone?.replace(/\D/g, "") || "";
  return (
    sale.customerEmail?.toLowerCase() ||
    (normalizedPhone ? `phone:${normalizedPhone}` : "") ||
    (sale.customerName ? `name:${sale.customerName.toLowerCase()}` : "") ||
    "walk-in"
  );
};

export function buildCustomersFromSales(
  sales: Sale[]
): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();

  sales.forEach((sale) => {
    const key = normalizeKey(sale);
    const saleDate = new Date(sale.date);
    const existing = map.get(key);

    if (existing) {
      existing.totalSpent += sale.total;
      existing.purchaseCount += 1;
      existing.sales.push(sale);
      if (saleDate > existing.lastPurchase) {
        existing.lastPurchase = saleDate;
      }
      if (sale.customerEmail && !existing.email) {
        existing.email = sale.customerEmail;
      }
      if (sale.customerPhone && !existing.phone) {
        existing.phone = sale.customerPhone;
      }
    } else {
      map.set(key, {
        id: key,
        name: sale.customerName?.trim() || WALK_IN_CUSTOMER_NAME,
        email: sale.customerEmail || undefined,
        phone: sale.customerPhone || undefined,
        totalSpent: sale.total,
        purchaseCount: 1,
        lastPurchase: saleDate,
        sales: [sale],
      });
    }
  });

  return Array.from(map.values()).map((customer) => ({
    ...customer,
    sales: [...customer.sales].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
  })).sort(
    (a, b) => b.lastPurchase.getTime() - a.lastPurchase.getTime()
  );
}
