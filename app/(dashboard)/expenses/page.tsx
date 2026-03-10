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
      <div className="shrink-0 px-4 pt-2 pb-3 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v as ExpensePageMode)}
              className="w-full"
            >
              <TabsList className="grid w-full max-w-md grid-cols-2 h-11">
                <TabsTrigger value="add_stock">
                  {t("expenses.addStock")}
                </TabsTrigger>
                <TabsTrigger value="expense_out">
                  {t("expenses.expenseOut")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-sm text-muted-foreground mt-1.5">
              {mode === "add_stock"
                ? t("expenses.addStockDesc")
                : t("expenses.expenseOutDesc")}
            </p>
                  </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/inventory/history">
                {t("expenses.viewRecentStock")}
              </Link>
                  </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/expenses/history">
                {t("expenses.viewRecentExpenses")}
              </Link>
                  </Button>
                </div>
              </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {mode === "add_stock" ? (
          <AddStockView />
        ) : (
          <PosPageContent mode="expense" />
        )}
      </div>
    </div>
  );
}
