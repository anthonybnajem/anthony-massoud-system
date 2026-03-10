"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { usePosData } from "@/components/pos-data-provider";
import { useReceiptSettings } from "@/components/receipt-settings-provider";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  isWithinInterval,
} from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { salesApi } from "@/lib/db";
import { ReportFilters } from "./components/ReportFilters";
import { RevenueChart } from "./components/RevenueChart";
import { TopProductsChart } from "./components/TopProductsChart";
import { SalesTable } from "./components/SalesTable";
import {
  ProductBreakdownTable,
  ProductBreakdownRow,
} from "./components/ProductBreakdownTable";
import {
  exportToCSV,
  printReport,
  printInvoice,
  exportProductBreakdown,
} from "./utils/exportUtils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { buildCustomersFromSales } from "../customers/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { UserCircle2 } from "lucide-react";

export default function ReportsPage() {
  const { t } = useLanguage();
  const { sales, products, categories, expenses, customers: customerProfiles } = usePosData();
  const { settings: receiptSettings } = useReceiptSettings();
  const [dateRange, setDateRange] = useState("week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProductsData, setTopProductsData] = useState<any[]>([]);
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedRange, setAppliedRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const categoryLookup = useMemo(() => {
    const lookup = new Map<string, string>();
    categories?.forEach((cat) => {
      if (cat?.id) {
        lookup.set(cat.id, cat.name || "Uncategorized");
      }
    });
    return lookup;
  }, [categories]);
  const reportRef = useRef<HTMLDivElement>(null);
  const revenueChartRef = useRef<HTMLDivElement>(null);
  const topProductsChartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load data based on selected date range
  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);
      try {
        // Calculate date range
        const now = new Date();
        let start: Date;
        let end: Date = now;

        switch (dateRange) {
          case "day":
            start = subDays(now, 7); // Last 7 days
            break;
          case "week":
            start = startOfWeek(now);
            end = endOfWeek(now);
            break;
          case "month":
            start = startOfMonth(now);
            end = endOfMonth(now);
            break;
          case "custom":
            if (startDate && endDate) {
              start = new Date(startDate);
              end = new Date(endDate);
              end.setHours(23, 59, 59, 999); // End of the day
            } else {
              // Default to last 30 days if custom dates not set
              start = subDays(now, 30);
            }
            break;
          default:
            start = subDays(now, 30);
        }

        // Get sales for the date range
        const salesInRange = await salesApi.getByDateRange(start, end);
        setFilteredSales(salesInRange);

        // Get top selling products
        const topProducts = await salesApi.getTopSellingProducts(5);

        // Map product IDs to names
        const topProductsWithNames = await Promise.all(
          topProducts.map(async (item) => {
            const product = products.find((p) => p.id === item.productId);
            return {
              name: product ? product.name : "Unknown Product",
              sales: item.totalSold,
            };
          })
        );

        setTopProductsData(topProductsWithNames);

        // Generate revenue data based on date range
        const revenueChartData: any[] = [];

        if (dateRange === "day") {
          // Daily data for the last 7 days
          for (let i = 6; i >= 0; i--) {
            const date = subDays(now, i);
            const dayStart = new Date(date.setHours(0, 0, 0, 0));
            const dayEnd = new Date(date.setHours(23, 59, 59, 999));

            const dayRevenue = await salesApi.getRevenueByDateRange(
              dayStart,
              dayEnd
            );

            revenueChartData.push({
              name: format(date, "EEE"),
              sales: dayRevenue,
            });
          }
        } else if (dateRange === "week") {
          // Weekly data
          const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            const dayStart = new Date(date.setHours(0, 0, 0, 0));
            const dayEnd = new Date(date.setHours(23, 59, 59, 999));

            const dayRevenue = await salesApi.getRevenueByDateRange(
              dayStart,
              dayEnd
            );

            revenueChartData.push({
              name: days[i],
              sales: dayRevenue,
            });
          }
        } else if (dateRange === "month") {
          // Monthly data - group by week
          for (let i = 0; i < 4; i++) {
            const weekStart = new Date(start);
            weekStart.setDate(start.getDate() + i * 7);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            if (weekEnd > end) {
              weekEnd.setTime(end.getTime());
            }

            const weekRevenue = await salesApi.getRevenueByDateRange(
              weekStart,
              weekEnd
            );

            revenueChartData.push({
              name: `Week ${i + 1}`,
              sales: weekRevenue,
            });
          }
        } else if (dateRange === "custom") {
          // Custom date range - calculate appropriate intervals
          const dayDiff = Math.ceil(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (dayDiff <= 7) {
            // Show daily data if range is a week or less
            for (let i = 0; i < dayDiff; i++) {
              const date = new Date(start);
              date.setDate(start.getDate() + i);
              const dayStart = new Date(date.setHours(0, 0, 0, 0));
              const dayEnd = new Date(date.setHours(23, 59, 59, 999));

              const dayRevenue = await salesApi.getRevenueByDateRange(
                dayStart,
                dayEnd
              );

              revenueChartData.push({
                name: format(date, "MM/dd"),
                sales: dayRevenue,
              });
            }
          } else {
            // Show weekly data for longer ranges
            const weeks = Math.ceil(dayDiff / 7);
            for (let i = 0; i < weeks; i++) {
              const weekStart = new Date(start);
              weekStart.setDate(start.getDate() + i * 7);

              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);

              if (weekEnd > end) {
                weekEnd.setTime(end.getTime());
              }

              const weekRevenue = await salesApi.getRevenueByDateRange(
                weekStart,
                weekEnd
              );

              revenueChartData.push({
                name: `Week ${i + 1}`,
                sales: weekRevenue,
              });
            }
          }
        }

        setRevenueData(revenueChartData);
        setAppliedRange({ start, end });
      } catch (error) {
        console.error("Error loading report data:", error);
        toast({
          title: t("common.error"),
          description: t("reports.failedToLoad"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReportData();
  }, [dateRange, startDate, endDate, products, toast]);

  const handleExportCSV = () => {
    exportToCSV(filteredSales, reportRef, toast);
  };

  const handlePrintReport = () => {
    printReport(reportRef, filteredSales, toast);
  };

  const handlePrintInvoice = (sale: any) => {
    printInvoice(sale, toast);
  };

  const [isExportingSalesPdf, setIsExportingSalesPdf] = useState(false);

  const handleExportSalesPdf = async () => {
    const chartNodes = [
      { node: revenueChartRef.current, title: "Revenue Trend" },
      { node: topProductsChartRef.current, title: "Top Products" },
    ];

    const loadLogoData = async (src?: string | null) => {
      if (!src) return null;
      if (src.startsWith("data:")) return src;
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.warn("Failed to load store logo", err);
        return null;
      }
    };

    try {
      setIsExportingSalesPdf(true);
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const marginX = 40;
      const marginY = 40;
      let cursorY = marginY;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const ensureSpace = (height: number) => {
        if (cursorY + height > pageHeight - marginY) {
          pdf.addPage();
          cursorY = marginY;
        }
      };

      const logoData = await loadLogoData(receiptSettings?.storeLogo || null);
      if (logoData) {
        const logoWidth = 80;
        const logoHeight = 80;
        const logoX = pageWidth / 2 - logoWidth / 2;
        pdf.addImage(logoData, "PNG", logoX, cursorY, logoWidth, logoHeight);
        cursorY += logoHeight + 10;
      }

      pdf.setFontSize(18);
      pdf.text(receiptSettings?.storeName || "Sales Transactions", pageWidth / 2, cursorY, {
        align: "center",
      });
      cursorY += 18;
      pdf.setFontSize(10);
      pdf.text(selectedRangeLabel, pageWidth / 2, cursorY, { align: "center" });
      cursorY += 20;
      pdf.text(format(new Date(), "MMMM dd, yyyy 'at' HH:mm a"), pageWidth / 2, cursorY, {
        align: "center",
      });
      cursorY += 24;

      const summaryCards = [
        { label: "Total Revenue", value: `${receiptSettings?.currencySymbol || "$"}${totalRevenue.toFixed(2)}` },
        { label: "Transactions", value: totalTransactions.toString() },
        { label: "Avg. Ticket", value: `${receiptSettings?.currencySymbol || "$"}${averageTransaction.toFixed(2)}` },
        { label: "Items Sold", value: totalItems.toString() },
        { label: "Expense Out", value: `${receiptSettings?.currencySymbol || "$"}${Math.abs(totalExpenses).toFixed(2)}` },
        { label: "Income Net", value: `${receiptSettings?.currencySymbol || "$"}${incomeNet.toFixed(2)}` },
      ];

      pdf.setFontSize(11);
      const columnWidth = (pageWidth - marginX * 2) / 2 - 10;
      summaryCards.forEach((card, index) => {
        ensureSpace(32);
        const col = index % 2;
        const x = marginX + col * (columnWidth + 10);
        pdf.setDrawColor(230);
        pdf.setFillColor(247, 248, 250);
        pdf.roundedRect(x, cursorY, columnWidth, 36, 4, 4, "FD");
        pdf.setTextColor(107, 114, 128);
        pdf.text(card.label.toUpperCase(), x + 8, cursorY + 14);
        pdf.setTextColor(17, 24, 39);
        pdf.setFontSize(14);
        pdf.text(card.value, x + 8, cursorY + 28);
        if (col === 1) {
          cursorY += 44;
          pdf.setFontSize(11);
        }
      });
      if (summaryCards.length % 2 === 1) {
        cursorY += 44;
      }

      const addChartImage = async (node: HTMLDivElement | null, title: string) => {
        if (!node) return;
        try {
          const canvas = await html2canvas(node, {
            backgroundColor: "#ffffff",
            scale: 2,
            useCORS: true,
          });
          const imgData = canvas.toDataURL("image/png");
          const chartWidth = pageWidth - marginX * 2;
          const chartHeight = (canvas.height / canvas.width) * chartWidth;
          ensureSpace(chartHeight + 30);
          pdf.setFontSize(12);
          pdf.text(title, marginX, cursorY + 14);
          pdf.addImage(imgData, "PNG", marginX, cursorY + 20, chartWidth, chartHeight);
          cursorY += chartHeight + 36;
        } catch (error) {
          console.warn(`Failed to capture chart ${title}`, error);
        }
      };

      for (const chartInfo of chartNodes) {
        await addChartImage(chartInfo.node, chartInfo.title);
      }

      ensureSpace(30);
      pdf.setFontSize(13);
      pdf.text("Sales Transactions", marginX, cursorY + 14);
      cursorY += 20;

      const tableColumns = [
        { key: "date", label: "Date", width: 120 },
        { key: "customer", label: "Customer", width: 130 },
        { key: "payment", label: "Payment", width: 90 },
        { key: "items", label: "Items", width: 140 },
        { key: "amount", label: "Amount", width: 80, align: "right" as const },
      ];

      const paymentLabel = (method: string) =>
        method === "credit"
          ? "Credit Card"
          : method === "cash"
          ? "Cash"
          : "Mobile";

      const saleRows = filteredSales.map((sale) => {
        const itemNames = sale.items
          .map((item: any) => item.product?.name || item.name || item.productId || "Item")
          .slice(0, 2)
          .join(", ");
        const extra = sale.items.length > 2 ? ` +${sale.items.length - 2} more` : "";
        return {
          date: format(new Date(sale.date), "MMM dd, yyyy HH:mm"),
          customer: sale.customerName || "Walk-in Customer",
          payment: paymentLabel(sale.paymentMethod),
          items: `${itemNames}${extra}`,
          amount: `${receiptSettings?.currencySymbol || "$"}${sale.total.toFixed(2)}`,
        };
      });

      const lineHeight = 12;
      const columnOffsets = tableColumns.map((col, idx) =>
        tableColumns.slice(0, idx).reduce((sum, current) => sum + current.width, 0)
      );

      const renderCell = (
        text: string,
        columnIndex: number,
        align: "left" | "right" = "left"
      ) => {
        const x = marginX + columnOffsets[columnIndex];
        const width = tableColumns[columnIndex].width;
        pdf.setFontSize(10);
        const lines = pdf.splitTextToSize(text, width - 6);
        lines.forEach((line: string | string[], index: number) => {
          const textY = cursorY + 12 + index * lineHeight;
          if (align === "right") {
            pdf.text(line, x + width - 3, textY, { align: "right" });
          } else {
            pdf.text(line, x + 3, textY);
          }
        });
        return lines.length;
      };

      const drawRow = (row: typeof saleRows[number]) => {
        const lineHeights = tableColumns.map((col, index) =>
          renderCell((row as any)[col.key], index, col.align ?? "left")
        );
        const usedLines = Math.max(...lineHeights);
        cursorY += usedLines * lineHeight + 6;
        ensureSpace(lineHeight);
        pdf.setDrawColor(230);
        pdf.line(marginX, cursorY, pageWidth - marginX, cursorY);
        cursorY += 4;
      };

      pdf.setFontSize(11);
      pdf.setFillColor(243, 244, 246);
      pdf.setDrawColor(229, 231, 235);
      let headerX = marginX;
      tableColumns.forEach((col) => {
        pdf.rect(headerX, cursorY, col.width, 18, "FD");
        pdf.setTextColor(107, 114, 128);
        pdf.text(col.label, headerX + 4, cursorY + 12);
        headerX += col.width;
      });
      cursorY += 24;
      pdf.setTextColor(17, 24, 39);

      for (const row of saleRows) {
        ensureSpace(40);
        drawRow(row);
      }

      pdf.save(`sales-transactions-${format(new Date(), "yyyyMMdd-HHmm")}.pdf`);
      toast({ title: t("alerts.pdfReady"), description: t("alerts.salesPdfGenerated") });
    } catch (error) {
      console.error("export pdf failed", error);
      toast({
        title: t("alerts.exportError"),
        description: t("alerts.unableToGeneratePdfTryAgain"),
        variant: "destructive",
      });
    } finally {
      setIsExportingSalesPdf(false);
    }
  };

  const handleExportProductBreakdown = (rows: ProductBreakdownRow[]) => {
    exportProductBreakdown(rows, toast);
  };

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

  // Calculate summary statistics
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredSales.length;
  const averageTransaction =
    totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const totalItems = filteredSales.reduce(
    (sum, sale) => sum + sale.items.length,
    0
  );

  // Expenses (expense_out only) and income net for the applied date range
  const totalExpenses = useMemo(() => {
    if (!appliedRange.start || !appliedRange.end) return 0;
    const start = appliedRange.start.getTime();
    const end = appliedRange.end.getTime();
    return expenses
      .filter(
        (exp) =>
          exp.expenseType === "expense_out" &&
          new Date(exp.date).getTime() >= start &&
          new Date(exp.date).getTime() <= end
      )
      .reduce((sum, exp) => sum + exp.total, 0);
  }, [expenses, appliedRange.start, appliedRange.end]);
  const incomeNet = totalRevenue - Math.abs(totalExpenses);

  // Monthly breakdown: total income, expenses, income net per month in the applied range
  const monthlyBreakdown = useMemo(() => {
    if (!appliedRange.start || !appliedRange.end) return [];
    const start = startOfMonth(appliedRange.start);
    const end = endOfMonth(appliedRange.end);
    const rows: { monthKey: string; monthLabel: string; totalIncome: number; expenses: number; incomeNet: number }[] = [];
    let current = new Date(start);
    while (current <= end) {
      const monthStart = startOfMonth(current);
      const monthEnd = endOfMonth(current);
      const monthSales = filteredSales.filter((sale) => {
        const d = new Date(sale.date);
        return isWithinInterval(d, { start: monthStart, end: monthEnd });
      });
      const monthExpenses = expenses.filter(
        (exp) =>
          exp.expenseType === "expense_out" &&
          isWithinInterval(new Date(exp.date), { start: monthStart, end: monthEnd })
      );
      const totalIncome = monthSales.reduce((sum, s) => sum + s.total, 0);
      const expenseTotal = monthExpenses.reduce((sum, e) => sum + e.total, 0);
      const expenseOutAmount = Math.abs(expenseTotal);
      rows.push({
        monthKey: format(current, "yyyy-MM"),
        monthLabel: format(current, "MMMM yyyy"),
        totalIncome,
        expenses: expenseOutAmount,
        incomeNet: totalIncome - expenseOutAmount,
      });
      current = addMonths(current, 1);
    }
    return rows.reverse(); // most recent month first
  }, [appliedRange.start, appliedRange.end, filteredSales, expenses]);

  const uniqueCustomers = useMemo(() => {
    const ids = new Set(
      filteredSales.map((sale) =>
        sale.customerName && sale.customerName.trim().length > 0
          ? sale.customerName.trim()
          : "Walk-in Customer"
      )
    );
    return ids.size;
  }, [filteredSales]);

  const topCustomer = useMemo(() => {
    const totals = new Map<string, number>();
    filteredSales.forEach((sale) => {
      const key = sale.customerName?.trim()?.length
        ? sale.customerName.trim()
        : "Walk-in Customer";
      totals.set(key, (totals.get(key) || 0) + (sale.total || 0));
    });
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return null;
    return { name: sorted[0][0], total: sorted[0][1] };
  }, [filteredSales]);

  const productBreakdown = useMemo<ProductBreakdownRow[]>(() => {
    const map = new Map<string, {
      productId: string;
      name: string;
      quantity: number;
      revenue: number;
      category?: string;
      sku?: string;
    }>();
    filteredSales.forEach((sale) => {
      sale.items.forEach((item: any, index: number) => {
        const baseId =
          item.productId || item.product?.id || item.product?.productId || item.product?.sku;
        const productId = baseId || `${item.product?.name || "unknown"}-${sale.id}-${index}`;
        const product = products.find((p) => p.id === baseId);
        const name = item.product?.name || product?.name || item.name || "Unknown";
        if (productFilter !== "all" && productFilter !== productId) {
          return;
        }
        if (categoryFilter !== "all") {
          const matchesCategory = product?.categoryId === categoryFilter;
          if (!matchesCategory) {
            return;
          }
        }
        const quantity = typeof item.quantity === "number" ? item.quantity : Number(item.quantity) || 0;
        const rawPrice =
          typeof item.product?.price === "number"
            ? item.product.price
            : typeof item.price === "number"
            ? item.price
            : quantity && typeof item.total === "number"
            ? item.total / quantity
            : 0;
        const lineTotal =
          typeof item.total === "number" ? item.total : rawPrice * quantity;
        const categoryName =
          product?.category?.name || categoryLookup.get(product?.categoryId || "") || "Uncategorized";
        const sku = product?.sku || item.product?.sku || "-";
        const existing = map.get(productId);
        if (existing) {
          existing.quantity += quantity;
          existing.revenue += lineTotal;
        } else {
          map.set(productId, {
            productId,
            name,
            quantity,
            revenue: lineTotal,
            category: categoryName,
            sku,
          });
        }
      });
    });
    return Array.from(map.values()).map((row) => ({
      ...row,
      avgPrice: row.quantity ? row.revenue / row.quantity : 0,
    }));
  }, [filteredSales, products, productFilter, categoryFilter, categoryLookup]);

  const outstandingPayments = useMemo(() => {
    const allCustomers = buildCustomersFromSales(sales, customerProfiles);
    const rows: { id: string; name: string; status: "unpaid" | "partially_paid"; totalUnpaid: number }[] = [];
    allCustomers.forEach((customer) => {
      const unpaidSales = customer.sales.filter(
        (s) => s.paymentStatus === "unpaid" || s.paymentStatus === "partially_paid"
      );
      if (unpaidSales.length === 0) return;
      const hasPartially = customer.sales.some((s) => s.paymentStatus === "partially_paid");
      const status: "unpaid" | "partially_paid" = hasPartially ? "partially_paid" : "unpaid";
      const totalUnpaid = unpaidSales.reduce((sum, s) => {
        const paid = s.paymentStatus === "partially_paid" ? (s.amountPaid ?? 0) : 0;
        return sum + (s.total - paid);
      }, 0);
      rows.push({ id: customer.id, name: customer.name || "—", status, totalUnpaid });
    });
    return rows.sort((a, b) => b.totalUnpaid - a.totalUnpaid);
  }, [sales, customerProfiles]);

  const selectedRangeLabel = useMemo(() => {
    if (!appliedRange.start || !appliedRange.end) return "All time";
    return `${format(appliedRange.start, "MMM dd, yyyy")} – ${format(appliedRange.end, "MMM dd, yyyy")}`;
  }, [appliedRange]);

    //  return  <h1 className="text-2xl font-bold tracking-tight">Coming Soon!</h1>

  return (
    <motion.div
      className="space-y-2 overflow-hidden min-w-0"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("reports.totalRevenue")}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{t("reports.forSelectedPeriod")}</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("reports.transactions")}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">{t("reports.totalSales")}</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("reports.avgTransaction")}
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${averageTransaction.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{t("reports.perTransaction")}</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("reports.itemsSold")}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">{t("reports.totalItems")}</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("reports.expenseOut")}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.abs(totalExpenses).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{t("reports.forSelectedPeriod")}</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("reports.incomeNet")}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${incomeNet.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{t("reports.forSelectedPeriod")}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly breakdown: always visible so no empty gap; table or empty state */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("reports.byMonth")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {t("reports.totalIncome")}, {t("reports.incomeNet")}, {t("reports.expenseOut")} {t("reports.forSelectedPeriod")}
            </p>
          </CardHeader>
          <CardContent>
            {monthlyBreakdown.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">{t("reports.month")}</TableHead>
                      <TableHead className="text-right font-semibold">{t("reports.totalRevenue")}</TableHead>
                      <TableHead className="text-right font-semibold">{t("reports.expenseOut")}</TableHead>
                      <TableHead className="text-right font-semibold">{t("reports.incomeNet")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyBreakdown.map((row) => (
                      <TableRow key={row.monthKey}>
                        <TableCell className="font-medium">{row.monthLabel}</TableCell>
                        <TableCell className="text-right">${row.totalIncome.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${row.expenses.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">${row.incomeNet.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t("reports.noMonthlyDataYet")}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("reports.selectedDateRange")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-lg">{selectedRangeLabel}</p>
            {appliedRange.start && appliedRange.end && (
              <p className="text-xs text-muted-foreground mt-1">
                {Math.max(
                  1,
                  Math.ceil(
                    (appliedRange.end.getTime() - appliedRange.start.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )}{" "}
                {t("reports.daysOfData")}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("reports.customers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-lg">{uniqueCustomers}</p>
            <p className="text-xs text-muted-foreground">
              {t("reports.uniqueCustomersServed")}
            </p>
            {topCustomer && (
              <p className="text-xs text-muted-foreground mt-2">
                {t("reports.topCustomer")} <span className="font-medium">{topCustomer.name}</span>{" "}
                (${topCustomer.total.toFixed(2)})
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <ReportFilters
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          productFilter={productFilter}
          onProductFilterChange={setProductFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          products={products}
          categories={categories}
          onExportCSV={handleExportCSV}
          onPrint={handlePrintReport}
        />
      </motion.div>

      <div ref={reportRef}>
        <div className="space-y-6">
          <motion.div
            variants={itemVariants}
            className="grid gap-6 md:grid-cols-2"
          >
            <div ref={revenueChartRef}>
              <RevenueChart data={revenueData} isLoading={isLoading} />
            </div>
            <div ref={topProductsChartRef}>
              <TopProductsChart data={topProductsData} isLoading={isLoading} />
            </div>
          </motion.div>
          <motion.div variants={itemVariants}>
            <ProductBreakdownTable
              data={productBreakdown}
              isLoading={isLoading}
              onExport={handleExportProductBreakdown}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <SalesTable
              sales={filteredSales}
              isLoading={isLoading}
              onPrintInvoice={handlePrintInvoice}
              onExport={handleExportCSV}
              onExportPdf={handleExportSalesPdf}
              exportPdfLoading={isExportingSalesPdf}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-2 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <UserCircle2 className="h-5 w-5 text-primary" />
                  {t("reports.outstandingPayments")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("reports.outstandingPaymentsDesc")}
                </p>
              </CardHeader>
              <CardContent>
                {outstandingPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    {t("reports.noOutstandingPayments")}
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">{t("customers.customer")}</TableHead>
                          <TableHead className="font-semibold">{t("customers.payment")}</TableHead>
                          <TableHead className="text-right font-semibold">{t("reports.amountNotPaid")}</TableHead>
                          <TableHead className="w-[80px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outstandingPayments.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.name}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  row.status === "partially_paid"
                                    ? "text-amber-700 border-amber-300 bg-amber-50"
                                    : "text-red-700 border-red-300 bg-red-50"
                                }
                              >
                                {row.status === "partially_paid"
                                  ? t("customers.partiallyPaid")
                                  : t("customers.unpaid")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {receiptSettings?.currencySymbol || "$"}
                              {row.totalUnpaid.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/customers/${encodeURIComponent(row.id)}`}>
                                  {t("customers.view")}
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
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
