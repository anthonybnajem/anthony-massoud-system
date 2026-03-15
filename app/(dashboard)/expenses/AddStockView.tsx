"use client";

import { useState, useMemo, useCallback, useLayoutEffect, useRef } from "react";
import { usePosData, type Product } from "@/components/pos-data-provider";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/components/ui/use-toast";
import { SearchBar } from "@/app/(dashboard)/sales/components/SearchBar";
import { CategoryFilter } from "@/app/(dashboard)/sales/components/CategoryFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Trash2, LayoutGrid, List, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { useIsTablet } from "@/hooks/use-tablet";

type ProductVariation = NonNullable<Product["variations"]>[number];

export type RestockCartItem = {
  id: string;
  product: Product;
  quantity: number;
  /** Fixed from product cost or variation price */
  unitCost: number;
  /** Current stock before this restock (for display) */
  currentStock: number;
  variationId?: string;
  variationName?: string;
};

export function AddStockView() {
  const { t } = useLanguage();
  const { products: productsFromContext, categories, recordExpense } = usePosData();
  const { toast } = useToast();
  const isTablet = useIsTablet();

  const products = Array.isArray(productsFromContext) ? productsFromContext : [];

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "row">("grid");
  const [restockCart, setRestockCart] = useState<RestockCartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Per product or product+variation: quantity to add (for the inline form) */
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (activeCategory !== "all") {
      list = list.filter((p) => p.categoryId === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category?.name && p.category.name.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, activeCategory, searchQuery]);

  const filteredSimpleProducts = useMemo(
    () =>
      filteredProducts.filter(
        (p) => !Array.isArray(p.variations) || p.variations.length === 0
      ),
    [filteredProducts]
  );
  const filteredProductsWithVariations = useMemo(
    () =>
      filteredProducts.filter(
        (p) => Array.isArray(p.variations) && p.variations.length > 0
      ),
    [filteredProducts]
  );

  /** Single list for grid: simple products + each variation as its own item. */
  const gridItems = useMemo(() => {
    const simple = filteredSimpleProducts.map((product) => ({ type: "simple" as const, product }));
    const withVariations = filteredProductsWithVariations.flatMap((product) =>
      product.variations!.map((variation) => ({ type: "variation" as const, product, variation }))
    );
    return [...simple, ...withVariations];
  }, [filteredSimpleProducts, filteredProductsWithVariations]);

  const scrollRef = useRef<HTMLDivElement>(null);
  // Scroll to top once when category changes, after new content is in the DOM and before paint (avoids flash/glitch)
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [activeCategory]);

  const handleCategoryChange = useCallback((id: string) => {
    setActiveCategory(id);
  }, []);

  const lineId = (product: Product, variation?: ProductVariation) =>
    variation ? `restock-${product.id}-${variation.id}` : `restock-${product.id}`;

  const addToRestockCart = useCallback(
    (product: Product, quantity: number, variation?: ProductVariation) => {
      if (quantity < 1) return;
      const id = lineId(product, variation);
      const currentStock = variation ? variation.stock : product.stock;
      const unitCost = variation
        ? (typeof variation.price === "number" ? variation.price : product.cost ?? 0)
        : (typeof product.cost === "number" ? product.cost : 0);

      setRestockCart((prev) => {
        const existing = prev.find((item) => item.id === id);
        if (existing) {
          return prev.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [
          ...prev,
          {
            id,
            product,
            quantity,
            unitCost,
            currentStock,
            variationId: variation?.id,
            variationName: variation?.name,
          },
        ];
      });
      setQtyInputs((prev) => ({ ...prev, [id]: "" }));
    },
    []
  );

  const updateRestockItemQuantity = useCallback((lineId: string, quantity: number) => {
    setRestockCart((prev) =>
      prev.map((item) => (item.id !== lineId ? item : { ...item, quantity }))
    );
  }, []);

  const removeFromRestockCart = useCallback((lineId: string) => {
    setRestockCart((prev) => prev.filter((item) => item.id !== lineId));
  }, []);

  const restockTotalQty = useMemo(
    () => restockCart.reduce((sum, item) => sum + item.quantity, 0),
    [restockCart]
  );

  const handleConfirmRestock = useCallback(async () => {
    if (restockCart.length === 0) {
      toast({
        title: t("expenses.emptyRestockCart"),
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const items = restockCart.map((item) => ({
        id: item.id,
        type: "product" as const,
        productId: item.product.id,
        variationId: item.variationId,
        description: item.variationName
          ? `${item.product.name} (${item.variationName})`
          : item.product.name,
        quantity: item.quantity,
        unitCost: item.unitCost,
        total: item.quantity * item.unitCost,
      }));
      const total = items.reduce((s, i) => s + i.total, 0);
      await recordExpense({
        items,
        total: total > 0 ? -Math.abs(total) : -total,
        paymentMethod: "cash",
        expenseType: "restock",
      });
      setRestockCart([]);
      setQtyInputs({});
    } catch (e) {
      // recordExpense already toasts on error
    } finally {
      setIsSubmitting(false);
    }
  }, [restockCart, recordExpense, toast, t]);

  return (
    <div
      className={`flex h-full w-full flex-1 flex-col md:flex-row ${isTablet ? "gap-3" : "gap-4"} overflow-hidden min-w-0 p-3 sm:p-4 md:p-6`}
    >
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="space-y-3 mb-4 shrink-0 bg-background relative z-10">
          <div className={`card ${isTablet ? "p-3" : "p-4"}`}>
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isTablet={isTablet}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <CategoryFilter
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                isTablet={isTablet}
              />
            </div>
            <div className="flex items-center gap-1 shrink-0" role="group" aria-label={t("expenses.viewGrid")}>
              <Button
                type="button"
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                className="h-9 px-2.5"
                onClick={() => setViewMode("grid")}
                title={t("expenses.viewGrid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === "row" ? "default" : "outline"}
                size="sm"
                className="h-9 px-2.5"
                onClick={() => setViewMode("row")}
                title={t("expenses.viewRow")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-auto min-h-0"
          style={{ overflowAnchor: "none" }}
        >
          {filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center min-h-[320px] w-full p-4 bg-background">
              <div className="rounded-lg border-2 border-border bg-card p-6 shadow-sm max-w-md w-full">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </EmptyMedia>
                    <EmptyTitle>
                      {activeCategory !== "all"
                        ? t("expenses.noProductsInCategory")
                        : t("sales.noProductsFound")}
                    </EmptyTitle>
                    <EmptyDescription>
                      {activeCategory !== "all"
                        ? t("sales.tryAdjustingSearch")
                        : searchQuery
                          ? t("sales.tryAdjustingSearch")
                          : t("sales.noProductsAvailable")}
                    </EmptyDescription>
                  </EmptyHeader>
                  {activeCategory !== "all" && (
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => setActiveCategory("all")}
                        className="w-full sm:w-auto"
                      >
                        {t("expenses.showAllProducts")}
                      </Button>
                    </div>
                  )}
                </Empty>
              </div>
            </div>
          ) : viewMode === "row" ? (
            <div className="flex flex-col gap-3 w-full">
              {gridItems.map((item) =>
                item.type === "simple" ? (
                  <Card
                    key={item.product.id}
                    className="card flex flex-row items-center gap-3 p-3 transition-all touch-manipulation hover:shadow-sm border"
                  >
                    <div className="h-14 w-14 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                      {item.product.image ? (
                        <img
                          src={item.product.image || "/placeholder.svg"}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                      <span className="font-semibold text-sm truncate">{item.product.name}</span>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.product.category?.name ?? t("sales.uncategorized")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("expenses.currentStock")}: <strong className="text-foreground">{item.product.stock}</strong>
                      </p>
                    </div>
                    <div className="flex gap-2 items-center shrink-0">
                      <Input
                        type="number"
                        min={1}
                        placeholder={t("expenses.quantityToAdd")}
                        value={qtyInputs[lineId(item.product)] ?? ""}
                        onChange={(e) =>
                          setQtyInputs((prev) => ({
                            ...prev,
                            [lineId(item.product)]: e.target.value,
                          }))
                        }
                        className="h-9 min-w-[8rem] w-28"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 h-9 font-medium touch-manipulation"
                        onClick={() => {
                          const raw = qtyInputs[lineId(item.product)];
                          const q = parseInt(raw ?? "1", 10);
                          addToRestockCart(item.product, Number.isNaN(q) || q < 1 ? 1 : q);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t("sales.add")}
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card
                    key={`${item.product.id}-${item.variation.id}`}
                    className="card flex flex-row items-center gap-3 p-3 transition-all touch-manipulation hover:shadow-sm border"
                  >
                    <div className="h-14 w-14 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                      {item.product.image ? (
                        <img
                          src={item.product.image || "/placeholder.svg"}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                      <span className="font-semibold text-sm truncate">{item.product.name}</span>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.variation.name}
                        {item.product.category?.name ? ` · ${item.product.category.name}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("expenses.currentStock")}: <strong className="text-foreground">{item.variation.stock}</strong>
                      </p>
                    </div>
                    <div className="flex gap-2 items-center shrink-0">
                      <Input
                        type="number"
                        min={1}
                        placeholder={t("expenses.quantityToAdd")}
                        value={qtyInputs[lineId(item.product, item.variation)] ?? ""}
                        onChange={(e) =>
                          setQtyInputs((prev) => ({
                            ...prev,
                            [lineId(item.product, item.variation)]: e.target.value,
                          }))
                        }
                        className="h-9 min-w-[8rem] w-28"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 h-9 font-medium touch-manipulation"
                        onClick={() => {
                          const raw = qtyInputs[lineId(item.product, item.variation)];
                          const q = parseInt(raw ?? "1", 10);
                          addToRestockCart(item.product, Number.isNaN(q) || q < 1 ? 1 : q, item.variation);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t("sales.add")}
                      </Button>
                    </div>
                  </Card>
                )
              )}
            </div>
          ) : (
            <div className="w-full min-w-0">
              <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch w-full">
                {gridItems.map((item) =>
                  item.type === "simple" ? (
                    <div
                      key={item.product.id}
                      className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[240px] h-full overflow-hidden min-w-0"
                    >
                      <div className="shrink-0 px-5 pt-5 pb-3 border-b border-border/60">
                        <h3 className="text-base font-semibold text-foreground line-clamp-2 leading-snug">
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.product.category?.name ?? t("sales.uncategorized")}
                        </p>
                      </div>
                      <div className="flex-1 flex flex-col min-h-0 p-5">
                        <p className="text-sm text-muted-foreground">
                          {t("expenses.currentStock")}: <strong className="text-foreground">{item.product.stock}</strong>
                        </p>
                        <div className="mt-4 space-y-3">
                          <label className="text-xs font-medium text-muted-foreground block">
                            {t("expenses.quantityToAdd")}
                          </label>
                          <Input
                            type="number"
                            min={1}
                            placeholder="0"
                            value={qtyInputs[lineId(item.product)] ?? ""}
                            onChange={(e) =>
                              setQtyInputs((prev) => ({
                                ...prev,
                                [lineId(item.product)]: e.target.value,
                              }))
                            }
                            className="h-10 w-full text-base"
                          />
                          <Button
                            type="button"
                            className="w-full h-10 font-medium"
                            onClick={() => {
                              const raw = qtyInputs[lineId(item.product)];
                              const q = parseInt(raw ?? "1", 10);
                              addToRestockCart(item.product, Number.isNaN(q) || q < 1 ? 1 : q);
                            }}
                          >
                            {t("sales.add")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={`${item.product.id}-${item.variation.id}`}
                      className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[240px] h-full overflow-hidden min-w-0"
                    >
                      <div className="shrink-0 px-5 pt-5 pb-3 border-b border-border/60">
                        <h3 className="text-base font-semibold text-foreground line-clamp-2 leading-snug">
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.variation.name}
                          {item.product.category?.name ? ` · ${item.product.category.name}` : ""}
                        </p>
                      </div>
                      <div className="flex-1 flex flex-col min-h-0 p-5">
                        <p className="text-sm text-muted-foreground">
                          {t("expenses.currentStock")}: <strong className="text-foreground">{item.variation.stock}</strong>
                        </p>
                        <div className="mt-4 space-y-3">
                          <label className="text-xs font-medium text-muted-foreground block">
                            {t("expenses.quantityToAdd")}
                          </label>
                          <Input
                            type="number"
                            min={1}
                            placeholder="0"
                            value={qtyInputs[lineId(item.product, item.variation)] ?? ""}
                            onChange={(e) =>
                              setQtyInputs((prev) => ({
                                ...prev,
                                [lineId(item.product, item.variation)]: e.target.value,
                              }))
                            }
                            className="h-10 w-full text-base"
                          />
                          <Button
                            type="button"
                            className="w-full h-10 font-medium"
                            onClick={() => {
                              const raw = qtyInputs[lineId(item.product, item.variation)];
                              const q = parseInt(raw ?? "1", 10);
                              addToRestockCart(
                                item.product,
                                Number.isNaN(q) || q < 1 ? 1 : q,
                                item.variation
                              );
                            }}
                          >
                            {t("sales.add")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Restock cart sidebar */}
      <div
        className={`card flex flex-col w-full md:w-[340px] shrink-0 max-h-full overflow-hidden border border-border ${isTablet ? "p-3" : "p-4"}`}
      >
        <h3 className="font-semibold text-sm mb-3 shrink-0">
          {t("expenses.restockCart")} ({restockCart.length})
        </h3>
        {restockCart.length === 0 ? (
          <p className="text-sm text-muted-foreground shrink-0">
            {t("expenses.emptyRestockCart")}
          </p>
        ) : (
          <>
            <div className="flex-1 overflow-auto space-y-3 min-h-0">
              {restockCart.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-3 space-y-2 text-sm"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-medium line-clamp-2">
                        {item.product.name}
                        {item.variationName && (
                          <span className="text-muted-foreground font-normal">
                            {" "}({item.variationName})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("expenses.currentStock")}: {item.currentStock} → +{item.quantity}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => removeFromRestockCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t("expenses.quantityToAdd")}
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isNaN(v) && v >= 1)
                          updateRestockItemQuantity(item.id, v);
                      }}
                      className="h-8 mt-0.5"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 mt-3 shrink-0">
              <p className="text-sm font-semibold flex justify-between">
                <span>{t("expenses.totalQuantity")}</span>
                <span>{restockTotalQty}</span>
              </p>
              <Button
                className="w-full mt-3"
                onClick={handleConfirmRestock}
                disabled={isSubmitting || restockCart.length === 0}
              >
                {isSubmitting ? t("common.loading") : t("expenses.confirmRestock")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
