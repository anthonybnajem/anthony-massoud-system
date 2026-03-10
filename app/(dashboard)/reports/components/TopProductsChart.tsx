"use client";

import { useLanguage } from "@/components/language-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { BarChart as BarChartIcon } from "lucide-react";
import { ChartTooltip } from "./ChartTooltip";

interface TopProductsChartProps {
  data: any[];
  isLoading: boolean;
}

export function TopProductsChart({ data, isLoading }: TopProductsChartProps) {
  const { t } = useLanguage();
  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChartIcon className="h-5 w-5 text-primary" />
          {t("reports.topProducts")}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Spinner className="h-6 w-6" />
            <p className="text-sm text-muted-foreground">{t("reports.loadingData")}</p>
          </div>
        ) : data.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BarChartIcon className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>{t("reports.noDataAvailable")}</EmptyTitle>
              <EmptyDescription>
                {t("reports.noDataAvailable")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#8884d8" />
              <YAxis stroke="#8884d8" />
              <RechartsTooltip content={<ChartTooltip />} />
              <Bar
                dataKey="sales"
                fill="rgb(239, 68, 68)"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
