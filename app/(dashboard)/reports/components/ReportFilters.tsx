"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Download, Printer } from "lucide-react";
import { type Product, type Category } from "@/components/pos-data-provider";
import { useLanguage } from "@/components/language-provider";

interface ReportFiltersProps {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  productFilter: string;
  onProductFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  products: Product[];
  categories: Category[];
  onExportCSV: () => void;
  onPrint: () => void;
}

export function ReportFilters({
  dateRange,
  onDateRangeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  productFilter,
  onProductFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  products,
  categories,
  onExportCSV,
  onPrint,
}: ReportFiltersProps) {
  const { t } = useLanguage();
  const rangeDescriptions: Record<string, string> = {
    day: t("reports.dailyView"),
    week: t("reports.weeklyView"),
    month: t("reports.monthlyView"),
    custom: t("reports.customView"),
  };

  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6">
          {/* Date Range Section */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 min-w-[120px]">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("reports.dateRange")}</span>
            </div>
            <div className="flex flex-wrap gap-3 flex-1">
              <Select value={dateRange} onValueChange={onDateRangeChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("reports.dateRange")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{t("reports.daily")}</SelectItem>
                  <SelectItem value="week">{t("reports.weekly")}</SelectItem>
                  <SelectItem value="month">{t("reports.monthly")}</SelectItem>
                  <SelectItem value="custom">{t("reports.custom")}</SelectItem>
                </SelectContent>
              </Select>

              {dateRange === "custom" && (
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => onStartDateChange(e.target.value)}
                      className="w-[160px]"
                    />
                    <span className="text-sm text-muted-foreground">{t("reports.to")}</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => onEndDateChange(e.target.value)}
                      className="w-[160px]"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground ml-7">
            {rangeDescriptions[dateRange] || t("reports.selectRange")}
          </p>

          {/* Filters Section */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 min-w-[120px]">
              <span className="text-sm font-medium">{t("reports.filters")}</span>
            </div>
            <div className="flex flex-wrap gap-3 flex-1">
              <Select
                value={productFilter}
                onValueChange={onProductFilterChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("reports.product")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("reports.allProducts")}</SelectItem>
                  {products &&
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select
                value={categoryFilter}
                onValueChange={onCategoryFilterChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("reports.category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("reports.allCategories")}</SelectItem>
                  {categories &&
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-2 border-t">
            <div className="flex-1" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={onExportCSV} className="gap-2" disabled>
                <Download className="h-4 w-4" />
                {t("reports.exportCsvComingSoon")}
              </Button>
              {/* <Button variant="outline" onClick={onPrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button> */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
