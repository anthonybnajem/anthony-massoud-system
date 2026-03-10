"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  type StockMovement,
  type Product,
} from "@/components/pos-data-provider";
import { useLanguage } from "@/components/language-provider";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { History, ChevronLeft, ChevronRight } from "lucide-react";
import { formatMeasurementValue } from "@/lib/product-measurements";

const ROWS_PER_PAGE = 10;

interface StockMovementHistoryProps {
  movements: StockMovement[];
  products: Product[];
}

export function StockMovementHistory({
  movements,
  products,
}: StockMovementHistoryProps) {
  const { t } = useLanguage();
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [movements.length]);

  const totalPages = Math.max(1, Math.ceil(movements.length / ROWS_PER_PAGE));
  const paginatedMovements = useMemo(() => {
    const start = page * ROWS_PER_PAGE;
    return movements.slice(start, start + ROWS_PER_PAGE);
  }, [movements, page]);

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || t("inventory.unknownProduct");
  };

  const isSystemIdNote = (notes: string | undefined) =>
    !notes ||
    /^Sale ID: .+$/.test(notes) ||
    /Restock.*Expense ID: .+/.test(notes) ||
    /^Expense ID: .+$/.test(notes);

  const displayNotes = (notes: string | undefined) =>
    isSystemIdNote(notes) ? "-" : (notes || "-");

  const getMovementTypeBadge = (type: StockMovement["type"]) => {
    const variants: Record<
      StockMovement["type"],
      {
        labelKey: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      adjustment: { labelKey: "inventory.adjustment", variant: "default" },
      sale: { labelKey: "inventory.sale", variant: "destructive" },
      purchase: { labelKey: "inventory.purchase", variant: "secondary" },
      return: { labelKey: "inventory.return", variant: "outline" },
      transfer: { labelKey: "inventory.transfer", variant: "outline" },
    };

    const config = variants[type] || variants.adjustment;
    return <Badge variant={config.variant}>{t(config.labelKey)}</Badge>;
  };

  if (movements.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <History className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>{t("inventory.noStockMovements")}</EmptyTitle>
          <EmptyDescription>
            {t("inventory.stockMovementHistoryDesc")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("inventory.date")}</TableHead>
            <TableHead>{t("reports.product")}</TableHead>
            <TableHead>{t("inventory.type")}</TableHead>
            <TableHead>{t("inventory.quantity")}</TableHead>
            <TableHead>{t("inventory.previous")}</TableHead>
            <TableHead>{t("inventory.new")}</TableHead>
            <TableHead className="w-0 whitespace-nowrap">{t("inventory.reason")}</TableHead>
            <TableHead className="w-0 whitespace-nowrap">{t("inventory.notes")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedMovements.map((movement) => (
            <TableRow key={movement.id} className="hover:bg-muted/50">
              {(() => {
                const quantityText = `${movement.quantity > 0 ? "+" : ""}${formatMeasurementValue(
                  Math.abs(movement.quantity)
                )}`;
                const previousText = formatMeasurementValue(
                  movement.previousStock
                );
                const newText = formatMeasurementValue(
                  movement.newStock
                );

                return (
                  <>
                    <TableCell className="font-medium">
                      {format(new Date(movement.date), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{getProductName(movement.productId)}</TableCell>
                    <TableCell>{getMovementTypeBadge(movement.type)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          movement.quantity > 0
                            ? "text-green-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {quantityText}
                      </span>
                    </TableCell>
                    <TableCell>{previousText}</TableCell>
                    <TableCell className="font-semibold">{newText}</TableCell>
                    <TableCell className="w-0 whitespace-nowrap">{movement.reason || "-"}</TableCell>
                    <TableCell className="w-0 whitespace-nowrap text-muted-foreground">
                      {displayNotes(movement.notes)}
                    </TableCell>
                  </>
                );
              })()}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-t text-sm">
        <p className="text-muted-foreground">
          {t("receipts.pageOf").replace("{current}", String(page + 1)).replace("{total}", String(totalPages))}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {t("common.previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((prev) => Math.min(prev + 1, totalPages - 1))
            }
            disabled={page >= totalPages - 1}
            className="gap-1"
          >
            {t("common.next")}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
