"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { ShoppingCart } from "lucide-react";
import { type Sale } from "@/components/pos-data-provider";
import { useLanguage } from "@/components/language-provider";

interface RecentSalesListProps {
  sales: Sale[];
}

export function RecentSalesList({ sales }: RecentSalesListProps) {
  const { t, locale } = useLanguage();
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-medium text-slate-700">
            {t("dashboard.recentSalesTitle")}
          </CardTitle>
        </div>
        <Link
          href="/receipts"
          className="text-sm font-medium text-slate-600 transition hover:text-slate-800"
        >
          {t("dashboard.viewMore")}
        </Link>
      </CardHeader>
      <CardContent>
        {sales.length > 0 ? (
          <div className="divide-y divide-white/30 rounded-xl border border-white/30">
            {sales.slice(0, 5).map((sale) => (
              <Link
                key={sale.id}
                href={`/receipts/${encodeURIComponent(sale.id)}`}
                className="flex items-center justify-between gap-4 px-4 py-3 transition duration-200 ease-in-out hover:bg-white/20"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Receipt #{sale.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(sale.date).toLocaleString(locale === "ar" ? "ar" : "en-US")}
                  </p>
                </div>
                <p className="text-end text-sm font-medium text-slate-700">
                  ${sale.total.toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingCart className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>{t("dashboard.noSalesRecorded")}</EmptyTitle>
              <EmptyDescription>
                {t("dashboard.startSalesToSee")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Link
          href="/receipts"
          className="text-sm font-medium text-slate-600 transition hover:text-slate-800"
        >
          {t("dashboard.viewMore")}
        </Link>
      </CardFooter>
    </Card>
  );
}
