"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePosData } from "@/components/pos-data-provider";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";
import { StockMovementHistory } from "../components/StockMovementHistory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { type StockMovement } from "@/components/pos-data-provider";
import { format, subDays } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { stockMovementsApi } from "@/lib/db";

export default function InventoryHistoryPage() {
  const { t } = useLanguage();
  const { stockMovements, products, fetchData } = usePosData();
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter movements
  const filteredMovements = stockMovements.filter((movement) => {
    const matchesType = filterType === "all" || movement.type === filterType;
    const matchesProduct =
      filterProduct === "all" || movement.productId === filterProduct;

    let matchesDate = true;
    if (dateRange !== "all") {
      const days = parseInt(dateRange);
      const startDate = subDays(new Date(), days);
      matchesDate = new Date(movement.date) >= startDate;
    }

    return matchesType && matchesProduct && matchesDate;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const handleExportMovements = () => {
    if (filteredMovements.length === 0) {
      toast({
        title: t("inventory.nothingToExport"),
        description: t("inventory.noStockMovementsMatch"),
      });
      return;
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      total: filteredMovements.length,
      movements: filteredMovements.map((movement) => ({
        ...movement,
        date: new Date(movement.date).toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock-movements-${format(
      new Date(),
      "yyyyMMdd-HHmmss"
    )}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: t("inventory.exportReady"),
      description: t("inventory.movementsExportedJson", { count: filteredMovements.length }),
    });
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const parsed = JSON.parse(text);
      const movements = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.movements)
        ? parsed.movements
        : [];

      if (movements.length === 0) {
        toast({
          title: t("inventory.importFailed"),
          description: t("inventory.noValidMovementsInFile"),
          variant: "destructive",
        });
        return;
      }

      for (const raw of movements as Partial<StockMovement>[]) {
        if (!raw.productId || !raw.type) {
          continue;
        }
        const movement: StockMovement = {
          id: raw.id && typeof raw.id === "string" ? raw.id : crypto.randomUUID(),
          productId: raw.productId,
          type: (raw.type as StockMovement["type"]) || "adjustment",
          quantity: Number(raw.quantity) || 0,
          previousStock: Number(raw.previousStock) || 0,
          newStock: Number(raw.newStock) || 0,
          reason: raw.reason,
          notes: raw.notes,
          userId: raw.userId,
          date: raw.date ? new Date(raw.date) : new Date(),
        };
        await stockMovementsApi.add(movement);
      }

      await fetchData();
      toast({
        title: t("inventory.importComplete"),
        description: t("inventory.movementsImported", { count: movements.length }),
      });
    } catch (error) {
      console.error("Failed to import stock movements:", error);
      toast({
        title: t("inventory.importFailed"),
        description: t("inventory.couldNotImportFile"),
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleExportCSV = () => {
    if (filteredMovements.length === 0) {
      toast({
        title: t("inventory.nothingToExport"),
        description: t("inventory.noStockMovementsMatch"),
      });
      return;
    }

    const headers = [
      "ID",
      "Product Name",
      "Product ID",
      "Movement Type",
      "Quantity",
      "Previous Stock",
      "New Stock",
      "Reason",
      "Notes",
      "Recorded By",
      "Date",
    ];

    const isSystemIdNote = (notes: string | undefined) =>
      !notes ||
      /^Sale ID: .+$/.test(notes) ||
      /Restock.*Expense ID: .+/.test(notes) ||
      /^Expense ID: .+$/.test(notes);
    const exportNotes = (notes: string | undefined) =>
      isSystemIdNote(notes) ? "" : (notes || "");

    const rows = filteredMovements.map((movement) => {
      const product =
        products.find((p) => p.id === movement.productId) || null;
      return [
        movement.id,
        product?.name || t("inventory.unknownProduct"),
        movement.productId,
        movement.type,
        movement.quantity.toString(),
        movement.previousStock.toString(),
        movement.newStock.toString(),
        movement.reason || "",
        exportNotes(movement.notes),
        movement.userId || "",
        new Date(movement.date).toISOString(),
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock-movements-${format(
      new Date(),
      "yyyyMMdd-HHmmss"
    )}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: t("inventory.exportReady"),
      description: t("inventory.movementsExportedCsv", { count: filteredMovements.length }),
    });
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 overflow-hidden min-w-0"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("inventory.stockMovementHistory")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("inventory.viewAllStockMovements")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters + Actions in one row */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 lg:max-w-2xl">
                <div className="space-y-2">
                  <Label>{t("inventory.movementType")}</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder={t("inventory.allTypes")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("inventory.allTypes")}</SelectItem>
                      <SelectItem value="adjustment">{t("inventory.adjustment")}</SelectItem>
                      <SelectItem value="sale">{t("inventory.sale")}</SelectItem>
                      <SelectItem value="purchase">{t("inventory.purchase")}</SelectItem>
                      <SelectItem value="return">{t("inventory.return")}</SelectItem>
                      <SelectItem value="transfer">{t("inventory.transfer")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("reports.product")}</Label>
                  <Select value={filterProduct} onValueChange={setFilterProduct}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder={t("inventory.allProducts")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("inventory.allProducts")}</SelectItem>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("reports.dateRange")}</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder={t("inventory.dateRangePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("inventory.allTime")}</SelectItem>
                      <SelectItem value="7">{t("inventory.last7Days")}</SelectItem>
                      <SelectItem value="30">{t("inventory.last30Days")}</SelectItem>
                      <SelectItem value="90">{t("inventory.last90Days")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button variant="outline" onClick={handleExportMovements}>
                  {t("inventory.exportJson")}
                </Button>
                <Button variant="outline" onClick={handleExportCSV}>
                  {t("inventory.exportCsv")}
                </Button>
                <Button variant="default" onClick={triggerImport} disabled={isImporting}>
                  {isImporting ? t("inventory.importing") : t("inventory.import")}
                </Button>
                <p className="text-sm text-muted-foreground lg:ml-1">
                  {t("inventory.movementsCount", { count: filteredMovements.length })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* History Table */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 shadow-sm overflow-hidden">
          <CardContent className="overflow-hidden min-w-0 p-0">
            <StockMovementHistory
              movements={filteredMovements}
              products={products}
            />
          </CardContent>
        </Card>
      </motion.div>
      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        className="hidden"
        onChange={handleImportFile}
      />
    </motion.div>
  );
}
