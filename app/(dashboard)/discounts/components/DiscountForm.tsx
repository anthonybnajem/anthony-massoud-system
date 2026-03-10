"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SwitchRow } from "@/components/ui/switch-row";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { type Discount, type DiscountType } from "@/lib/db";
import {
  type Product,
  type Category,
} from "@/components/pos-data-provider";

type DiscountFormData = Omit<Discount, "id" | "usageCount">;

interface DiscountFormProps {
  discount: DiscountFormData;
  onChange: (discount: DiscountFormData) => void;
  showUsageCount?: boolean;
  usageCount?: number;
  usageLimit?: number;
  products?: Product[];
  categories?: Category[];
  currencySymbol?: string;
}

export function DiscountForm({
  discount,
  onChange,
  showUsageCount = false,
  usageCount,
  usageLimit,
  products = [],
  categories = [],
  currencySymbol = "$",
}: DiscountFormProps) {
  const { t } = useLanguage();
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const selectedProducts = useMemo(() => {
    if (!discount.productIds?.length) return [];
    return products.filter((product) =>
      discount.productIds?.includes(product.id)
    );
  }, [products, discount.productIds]);
  const selectedCategories = useMemo(() => {
    if (!discount.categoryIds?.length) return [];
    return categories.filter((category) =>
      discount.categoryIds?.includes(category.id)
    );
  }, [categories, discount.categoryIds]);
  const filteredProducts = useMemo(() => {
    const query = productSearch.toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      product.name.toLowerCase().includes(query)
    );
  }, [products, productSearch]);
  const filteredCategories = useMemo(() => {
    const query = categorySearch.toLowerCase();
    if (!query) return categories;
    return categories.filter((category) =>
      (category.name || "").toLowerCase().includes(query)
    );
  }, [categories, categorySearch]);
  const toggleProduct = (productId: string) => {
    const existing = discount.productIds || [];
    const next = existing.includes(productId)
      ? existing.filter((id) => id !== productId)
      : [...existing, productId];
    onChange({ ...discount, productIds: next });
  };
  const toggleCategory = (categoryId: string) => {
    const existing = discount.categoryIds || [];
    const next = existing.includes(categoryId)
      ? existing.filter((id) => id !== categoryId)
      : [...existing, categoryId];
    onChange({ ...discount, categoryIds: next });
  };
  const formatDiscountDisplay = (baseValue?: number) => {
    if (discount.type === "percentage") {
      if (typeof baseValue === "number") {
        const amount = baseValue * (discount.value / 100);
        return `${discount.value}% (${currencySymbol}${amount.toFixed(2)})`;
      }
      return `${discount.value}%`;
    }
    return `${currencySymbol}${discount.value.toFixed(2)}`;
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("discounts.discountName")}</Label>
        <Input
          id="name"
          value={discount.name}
          onChange={(e) => onChange({ ...discount, name: e.target.value })}
          placeholder={t("discounts.namePlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">{t("discounts.discountCodeOptional")}</Label>
        <Input
          id="code"
          value={discount.code || ""}
          onChange={(e) => onChange({ ...discount, code: e.target.value })}
          placeholder={t("discounts.codePlaceholder")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">{t("discounts.discountType")}</Label>
          <Select
            value={discount.type}
            onValueChange={(value: DiscountType) =>
              onChange({ ...discount, type: value })
            }
          >
            <SelectTrigger>
f              <SelectValue placeholder={t("discounts.selectTypePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">{t("discounts.percentage")}</SelectItem>
              <SelectItem value="fixed">{t("discounts.fixedAmount")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">
            {discount.type === "percentage"
              ? t("discounts.percentageValue")
              : t("discounts.fixedAmountLabel")}
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              {discount.type === "percentage" ? (
                <Percent className="h-4 w-4 text-muted-foreground" />
              ) : (
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <Input
              id="value"
              type="number"
              value={discount.value || ""}
              onChange={(e) =>
                onChange({
                  ...discount,
                  value: Number.parseFloat(e.target.value) || 0,
                })
              }
              className="ps-9"
              placeholder={discount.type === "percentage" ? "25" : "10.00"}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="appliesTo">{t("discounts.appliesTo")}</Label>
        <Select
          value={discount.appliesTo}
          onValueChange={(value: "all" | "category" | "product" | "cart") =>
            onChange({
              ...discount,
              appliesTo: value,
              productIds: value === "product" ? discount.productIds || [] : [],
              categoryIds:
                value === "category" ? discount.categoryIds || [] : [],
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("discounts.selectWhereAppliesPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("discounts.badgeAllProducts")}</SelectItem>
            <SelectItem value="cart">{t("discounts.badgeCartTotal")}</SelectItem>
            <SelectItem value="category">{t("discounts.specificCategories")}</SelectItem>
            <SelectItem value="product">{t("discounts.specificProducts")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {discount.appliesTo === "product" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{t("discounts.selectProducts")}</Label>
            {discount.productIds?.length ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ ...discount, productIds: [] })}
              >
                {t("discounts.clear")}
              </Button>
            ) : null}
          </div>
          <Input
            placeholder={t("discounts.searchProductsPlaceholder")}
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
          <ScrollArea className="h-48 border rounded-md">
            <div className="p-2 space-y-2">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("discounts.noProductsMatch")}
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center justify-between gap-4 rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currencySymbol}
                        {product.price.toFixed(2)}
                      </p>
                    </div>
                    <Checkbox
                      checked={discount.productIds?.includes(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                    />
                  </label>
                ))
              )}
            </div>
          </ScrollArea>
          {selectedProducts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedProducts.map((product) => (
                <Badge key={product.id} variant="secondary">
                  <span className="truncate max-w-[120px]">{product.name}</span>
                  <span className="ms-1 text-xs text-muted-foreground">
                    {formatDiscountDisplay(product.price)}
                  </span>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("discounts.chooseProductsHint")}
            </p>
          )}
        </div>
      )}

      {discount.appliesTo === "category" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{t("discounts.selectCategories")}</Label>
            {discount.categoryIds?.length ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ ...discount, categoryIds: [] })}
              >
                {t("discounts.clear")}
              </Button>
            ) : null}
          </div>
          <Input
            placeholder={t("discounts.searchCategoriesPlaceholder")}
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
          />
          <ScrollArea className="h-48 border rounded-md">
            <div className="p-2 space-y-2">
              {filteredCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("discounts.noCategoriesFound")}
                </p>
              ) : (
                filteredCategories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center justify-between gap-4 rounded-md border px-3 py-2"
                  >
                    <p className="text-sm font-medium truncate">
                      {category.name}
                    </p>
                    <Checkbox
                      checked={discount.categoryIds?.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                  </label>
                ))
              )}
            </div>
          </ScrollArea>
          {selectedCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category) => (
                <Badge key={category.id} variant="secondary">
                  {category.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("discounts.selectCategoriesHint")}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <SwitchRow className="p-4 rounded-lg border bg-muted/50">
          <div className="space-y-0.5">
            <Label htmlFor="isActive" className="text-sm font-medium">
              {t("discounts.activeLabel")}
            </Label>
          </div>
          <Switch
            id="isActive"
            checked={discount.isActive}
            onCheckedChange={(checked) =>
              onChange({ ...discount, isActive: checked })
            }
          />
        </SwitchRow>
      </div>

      {showUsageCount && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            {t("discounts.usageCount", {
              count: usageCount ?? 0,
              limit: usageLimit ? ` / ${usageLimit}` : "",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
