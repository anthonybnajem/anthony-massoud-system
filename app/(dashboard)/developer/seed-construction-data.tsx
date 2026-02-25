"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Database, CheckCircle2, AlertCircle, Building2 } from "lucide-react";
import {
  CONSTRUCTION_CATEGORIES,
  CONSTRUCTION_CUSTOMERS,
  CONSTRUCTION_PRODUCTS,
  CONSTRUCTION_WORKERS,
  seedConstructionData,
} from "@/lib/seed-construction-data";

export function SeedConstructionDataTool() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<{
    categoriesAdded: number;
    productsAdded: number;
    productsSkipped: number;
    customersAdded: number;
    customersSkipped: number;
    projectsAdded: number;
    projectsSkipped: number;
    workersAdded: number;
    workersSkipped: number;
    workerAssignmentsAdded: number;
    workerAssignmentsSkipped: number;
    salesAdded: number;
    salesSkipped: number;
    stockMovementsAdded: number;
  } | null>(null);
  const { toast } = useToast();

  const handleSeed = async () => {
    setIsSeeding(true);
    setResult(null);
    try {
      const seeded = await seedConstructionData();
      setResult(seeded);
      toast({
        title: "Construction Data Seeded",
        description: `Added ${seeded.productsAdded} products, ${seeded.customersAdded} customers, ${seeded.projectsAdded} projects, ${seeded.workersAdded} workers, and ${seeded.salesAdded} sales.`,
      });
    } catch (error: any) {
      console.error("Construction seed error:", error);
      toast({
        title: "Seeding Failed",
        description: error?.message || "Failed to seed construction data",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Seed Construction Data
        </CardTitle>
        <CardDescription>
          Fill database with construction categories and sample products.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Seeds {CONSTRUCTION_CATEGORIES.length} categories,{" "}
            {CONSTRUCTION_PRODUCTS.length} products,{" "}
            {CONSTRUCTION_CUSTOMERS.length} customers, linked projects, plus
            {` ${CONSTRUCTION_WORKERS.length} workers with project assignments, plus `}
            sold/rented transaction history. Existing records are skipped when
            they match.
          </AlertDescription>
        </Alert>

        <Button onClick={handleSeed} disabled={isSeeding} className="w-full">
          {isSeeding ? (
            <>
              <Database className="mr-2 h-4 w-4 animate-spin" />
              Seeding...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Seed Construction Data
            </>
          )}
        </Button>

        {result && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Added {result.categoriesAdded} categories, added{" "}
            {result.productsAdded} products (skipped {result.productsSkipped}),
            added {result.customersAdded} customers (skipped{" "}
            {result.customersSkipped}), added {result.projectsAdded} projects
            (skipped {result.projectsSkipped}), added {result.workersAdded} workers
            (skipped {result.workersSkipped}), added{" "}
            {result.workerAssignmentsAdded} worker assignments (skipped{" "}
            {result.workerAssignmentsSkipped}), added {result.salesAdded} sales
            (skipped {result.salesSkipped}), and created{" "}
            {result.stockMovementsAdded} stock movements.
          </AlertDescription>
        </Alert>
      )}
      </CardContent>
    </Card>
  );
}
