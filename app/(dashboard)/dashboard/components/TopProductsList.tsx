"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Package } from "lucide-react";
import { type Product } from "@/components/pos-data-provider";

interface TopProductsListProps {
  products: Product[];
}

export function TopProductsList({ products }: TopProductsListProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-slate-700">
          Top Selling Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        {products.length > 0 ? (
          <div className="divide-y divide-white/30 rounded-xl border border-white/30">
            {products
              .sort((a, b) => b.stock - a.stock)
              .slice(0, 5)
              .map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition duration-200 ease-in-out hover:bg-white/20"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-white/40 shadow-[0_6px_14px_rgba(15,23,42,0.08)] flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {product.category.name}
                      </p>
                    </div>
                  </div>
                  <p className="text-right text-sm font-medium text-slate-700">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              ))}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Package className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No products added yet</EmptyTitle>
              <EmptyDescription>
                Add products to see your top sellers here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
