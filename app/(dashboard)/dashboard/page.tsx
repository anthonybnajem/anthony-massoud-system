"use client";

import { usePosData } from "@/components/pos-data-provider";
import { useSubscription } from "@/components/subscription-provider";
import { useLicense } from "@/components/license-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { StatsCard } from "./components/StatsCard";
import { LicenseStatusCard } from "./components/LicenseStatusCard";
import { StoreInfoCard } from "./components/StoreInfoCard";
import { RecentSalesList } from "./components/RecentSalesList";
import { TopProductsList } from "./components/TopProductsList";
import { DollarSign, Package, ShoppingCart, Tags } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { useEffect, useMemo } from "react";

export default function DashboardPage() {
   const {  setTheme } = useTheme()
    useEffect(() => {
      setTheme("light");
    }, [setTheme]);
  const { products, sales, categories } = usePosData();
  const { tier, activeStore, canUseEnterpriseFeatures } = useSubscription();
  const { licenseInfo, licenseStatus } = useLicense();

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    []
  );

  const salesToday = sales.filter(
    (sale) =>
      new Date(sale.date).toDateString() === new Date().toDateString()
  ).length;

  // Calculate total revenue
  const totalRevenue = sales.reduce((total, sale) => total + sale.total, 0);

  // Calculate total products
  const totalProducts = products.length;

  // Calculate total sales
  const totalSales = sales.length;

  // Calculate total categories
  const totalCategories = categories.length;

  // Find low stock products (less than 5 items)
  const lowStockProducts = products.filter((product) => product.stock < 5);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="space-y-6 overflow-hidden min-w-0">
      <div className="flex flex-col gap-2 mb-5">
        <p className="type-greeting">Welcome back</p>
        <p className="type-secondary">Overview for {todayLabel}</p>
      </div>

      <Label className="rounded-[14px] border border-white/50 bg-white/25 px-4 py-2 text-sm text-amber-600 shadow-[0_6px_18px_rgba(15,23,42,0.08)] backdrop-blur-[16px]">
        Hello, don’t forget to export your data from the Data
        Export and History (side menu) before closing the browser, until we finish the setup :)
      </Label>
      {/* <LicenseStatusCard
        tier={tier}
        licenseStatus={licenseStatus}
        licenseInfo={licenseInfo}
      /> */}

      <StoreInfoCard
        activeStore={activeStore}
        canUseEnterpriseFeatures={canUseEnterpriseFeatures}
      />

      <motion.div
        className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 min-w-0"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <StatsCard
          title="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          description="Across all completed sales"
          badge={{
            label: `${salesToday} sales today`,
            tone: salesToday > 0 ? "positive" : "neutral",
          }}
          meta={`Updated ${todayLabel}`}
          icon={DollarSign}
          variants={itemVariants}
          href="/reports"
        />
        <StatsCard
          title="Products"
          value={totalProducts}
          description={
            totalProducts > 0
              ? `${products.filter((p) => p.stock < 5).length} low stock items`
              : "No products yet"
          }
          badge={{
            label:
              lowStockProducts.length > 0
                ? `${lowStockProducts.length} low stock`
                : "Stock healthy",
            tone: lowStockProducts.length > 0 ? "negative" : "positive",
          }}
          meta={`Inventory snapshot ${todayLabel}`}
          icon={Package}
          variants={itemVariants}
          href="/products"
        />
        <StatsCard
          title="Sales"
          value={totalSales}
          description={
            totalSales > 0
              ? `${
                  sales.filter(
                    (s) =>
                      new Date(s.date).toDateString() ===
                      new Date().toDateString()
                  ).length
                } today`
              : "No sales yet"
          }
          badge={{
            label:
              salesToday > 0
                ? `${salesToday} today`
                : "Ready for first sale",
            tone: salesToday > 0 ? "positive" : "neutral",
          }}
          meta={`Activity ${todayLabel}`}
          icon={ShoppingCart}
          variants={itemVariants}
          href="/sales"
        />
        <StatsCard
          title="Categories"
          value={totalCategories}
          description={
            totalCategories > 0
              ? `${categories.length} total categories`
              : "No categories yet"
          }
          badge={{
            label:
              totalCategories > 0
                ? `${totalCategories} active`
                : "Add categories",
            tone: totalCategories > 0 ? "positive" : "neutral",
          }}
          meta={`Catalog ${todayLabel}`}
          icon={Tags}
          variants={itemVariants}
          href="/categories"
        />
      </motion.div>

      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Low Stock Alert</AlertTitle>
            <AlertDescription>
              {lowStockProducts.length} products are running low on stock.
              Please restock soon.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid gap-5 md:grid-cols-2 min-w-0"
      >
        <RecentSalesList sales={sales} />
        <TopProductsList products={products} />
      </motion.div>
    </div>
  );
}
