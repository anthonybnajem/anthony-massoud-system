"use client";
import type React from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ReceiptSettingsProvider } from "@/components/receipt-settings-provider";
import { useLanguage } from "@/components/language-provider";
import { LayoutDirectionProvider } from "@/components/layout-direction-context";
import type { TranslationKey } from "@/lib/translations";

const PATHNAME_TO_HEADER: Record<string, TranslationKey> = {
  "/dashboard": "header.dashboard",
  "/sales": "header.sales",
  "/products": "header.products",
  "/categories": "header.categories",
  "/reports": "header.reports",
  "/settings": "header.settings",
  "/expenses": "header.expenses",
  "/expenses/history": "header.recentExpenses",
  "/customers": "header.customers",
  "/projects": "header.projects",
  "/workers": "header.workers",
  "/services": "header.services",
  "/inventory": "header.inventory",
  "/discounts": "header.discounts",
  "/barcode-generator": "header.barcodeGenerator",
  "/receipt-designer": "header.receiptDesigner",
  "/receipts": "header.recentReceipts",
  "/data-export": "header.dataExport",
  "/tutorial": "header.tutorial",
  "/settings/subscription": "header.subscription",
  "/settings/stores": "header.stores",
  "/tax-settings": "header.taxSettings",
  "/employees": "header.employees",
  "/employees/shifts": "header.shifts",
  "/employees/closing-reports": "header.closingReports",
  "/developer": "header.developer",
  "/products/new": "header.newProduct",
};

function getHeaderKey(pathname: string): TranslationKey | null {
  if (PATHNAME_TO_HEADER[pathname]) return PATHNAME_TO_HEADER[pathname];
  if (pathname.startsWith("/receipts/")) return "header.receipts";
  if (pathname.startsWith("/expenses/")) return "header.expenses";
  if (pathname.startsWith("/customers/")) return "header.customers";
  if (pathname.startsWith("/projects/")) return "header.projects";
  if (pathname.startsWith("/workers/")) return "header.workers";
  if (pathname.startsWith("/inventory/")) return "header.inventory";
  return "header.dashboard";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t, locale } = useLanguage();
  const isSalesPage = pathname === "/sales" || pathname === "/expenses";
  const headerKey = getHeaderKey(pathname);
  const pageTitle = headerKey ? t(headerKey) : null;

  // Keep dashboard layout like English (sidebar left, content right) even when Arabic is selected.
  // Use a real block when Arabic so dir="ltr" establishes layout and table headers align with rows.
  const dashboardDir = locale === "ar" ? "ltr" : undefined;

  return (
    <AuthGuard>
      <ReceiptSettingsProvider>
        <LayoutDirectionProvider value={dashboardDir ?? null}>
        <div dir={dashboardDir}>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              {!isSalesPage && (
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                  <SidebarTrigger className="-ml-1" aria-label={t("common.toggleSidebar")} />
                  <Separator orientation="vertical" className="me-2 h-4" />
                  <div className="flex flex-1 items-center gap-2">
                    {pageTitle && (
                      <h1 className="text-lg font-semibold truncate">{pageTitle}</h1>
                    )}
                  </div>
                </header>
              )}
              <div
                className={cn(
                  "flex flex-1 flex-col overflow-hidden min-w-0",
                  isSalesPage ? "h-full" : "gap-4 p-4 md:p-8"
                )}
              >
                <div className="w-full overflow-hidden min-w-0 h-full">
                  {children}
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </div>
        </LayoutDirectionProvider>
      </ReceiptSettingsProvider>
    </AuthGuard>
  );
}
