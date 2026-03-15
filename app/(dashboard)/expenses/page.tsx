"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PosPageContent } from "@/app/(dashboard)/sales/PosPageContent";
import { AddStockView } from "./AddStockView";

type ExpensePageMode = "add_stock" | "expense_out";

export default function ExpensesPage() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<ExpensePageMode>("add_stock");

  return (
    <div className="flex flex-col h-full w-full overflow-hidden min-w-0">
      <div className="shrink-0 px-3 pt-2 pb-3 sm:px-4 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 w-full sm:max-w-md">
            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v as ExpensePageMode)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 h-10 sm:h-11 text-xs sm:text-sm">
                <TabsTrigger value="add_stock" className="min-w-0 truncate px-2 sm:px-4">
                  {t("expenses.addStock")}
                </TabsTrigger>
                <TabsTrigger value="expense_out" className="min-w-0 truncate px-2 sm:px-4">
                  {t("expenses.expenseOut")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
              {mode === "add_stock"
                ? t("expenses.addStockDesc")
                : t("expenses.expenseOutDesc")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
              <Link href="/inventory/history">
                {t("expenses.viewRecentStock")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
              <Link href="/expenses/history">
                {t("expenses.viewRecentExpenses")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0 min-w-0">
        {mode === "add_stock" ? (
          <AddStockView />
        ) : (
          <PosPageContent mode="expense" />
        )}
      </div>
    </div>
  );
}
