"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import { useLanguage } from "@/components/language-provider";
import type { Category, Product } from "@/lib/db";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import {
  DEFAULT_ITEM_INCREMENT,
  DEFAULT_ITEM_UNIT_LABEL,
  DEFAULT_RENTAL_INCREMENT,
  DEFAULT_RENTAL_UNIT_LABEL,
  DEFAULT_WEIGHT_INCREMENT,
  DEFAULT_WEIGHT_UNIT_LABEL,
} from "@/lib/product-constants";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z
    .number()
    .min(0, "Selling price must be a positive number")
    .optional(),
  rentalPrice: z
    .number()
    .min(0, "Rental price must be a positive number")
    .optional(),
  stock: z.number().min(0, "Stock must be a positive number"),
  categoryId: z.string().min(1, "Category is required"),
  barcode: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  sku: z.string().optional(),
  cost: z.number().min(0, "Cost must be a positive number").optional(),
  taxable: z.boolean().optional(),
  taxRate: z.number().min(0, "Tax rate must be a positive number").optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  saleType: z.enum(["item", "weight", "rental", "item_and_rental"]),
  unitLabel: z.string().min(1, "Unit label is required"),
  unitIncrement: z
    .number()
    .positive("Quantity step must be greater than zero"),
  variations: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Variation name is required"),
        price: z.number().min(0, "Price must be a positive number"),
        rentalPrice: z
          .number()
          .min(0, "Rental price must be a positive number"),
        stock: z.number().min(0, "Stock must be a positive number"),
      })
    )
    .optional(),
}).refine(
  (data) => (data.price ?? 0) > 0 || (data.rentalPrice ?? 0) > 0,
  { message: "Include at least a selling price or a renting price.", path: ["price"] }
);

type ProductFormValues = z.infer<typeof productSchema>;

interface AddProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  handleAddProduct: (data: Omit<Product, "id" | "category">) => void;
}

export default function AddProductDialog({
  isOpen,
  onOpenChange,
  categories,
  handleAddProduct,
}: AddProductDialogProps) {
  const { t } = useLanguage();
  const [generatedBarcode, setGeneratedBarcode] = useState("");

  const generateBarcode = () => {
    const barcode = Math.random().toString(36).substring(2, 12).toUpperCase();
    setGeneratedBarcode(barcode);
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: undefined as number | undefined,
      rentalPrice: undefined as number | undefined,
      stock: 0,
      categoryId: "",
      barcode: "",
      description: "",
      image: "",
      sku: "",
      cost: 0,
      taxable: false,
      taxRate: 0,
      tags: [],
      attributes: {},
      variations: [],
      saleType: "item",
      unitLabel: DEFAULT_ITEM_UNIT_LABEL,
      unitIncrement: DEFAULT_ITEM_INCREMENT,
    },
  });

  const {
    fields: variationFields,
    append: addVariation,
    remove: removeVariation,
    replace: replaceVariations,
  } = useFieldArray({
    control: form.control,
    name: "variations",
  });

  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [pricingMode, setPricingMode] = useState<"stable" | "variation">(
    "stable"
  );
  const saleType = form.watch("saleType");

  useEffect(() => {
    if (saleType === "weight") {
      if (
        !form.getValues("unitLabel") ||
        form.getValues("unitLabel") === DEFAULT_ITEM_UNIT_LABEL
      ) {
        form.setValue("unitLabel", DEFAULT_WEIGHT_UNIT_LABEL);
      }
      if (
        !form.getValues("unitIncrement") ||
        form.getValues("unitIncrement") === DEFAULT_ITEM_INCREMENT
      ) {
        form.setValue("unitIncrement", DEFAULT_WEIGHT_INCREMENT);
      }
    } else if (saleType === "rental" || saleType === "item_and_rental") {
      if (
        !form.getValues("unitLabel") ||
        form.getValues("unitLabel") === DEFAULT_ITEM_UNIT_LABEL ||
        form.getValues("unitLabel") === DEFAULT_WEIGHT_UNIT_LABEL
      ) {
        form.setValue("unitLabel", DEFAULT_RENTAL_UNIT_LABEL);
      }
      if (
        !form.getValues("unitIncrement") ||
        form.getValues("unitIncrement") === DEFAULT_ITEM_INCREMENT ||
        form.getValues("unitIncrement") === DEFAULT_WEIGHT_INCREMENT
      ) {
        form.setValue("unitIncrement", DEFAULT_RENTAL_INCREMENT);
      }
    } else {
      if (
        !form.getValues("unitLabel") ||
        form.getValues("unitLabel") === DEFAULT_WEIGHT_UNIT_LABEL ||
        form.getValues("unitLabel") === DEFAULT_RENTAL_UNIT_LABEL
      ) {
        form.setValue("unitLabel", DEFAULT_ITEM_UNIT_LABEL);
      }
      if (
        !form.getValues("unitIncrement") ||
        form.getValues("unitIncrement") === DEFAULT_WEIGHT_INCREMENT ||
        form.getValues("unitIncrement") === DEFAULT_RENTAL_INCREMENT
      ) {
        form.setValue("unitIncrement", DEFAULT_ITEM_INCREMENT);
      }
    }
  }, [saleType, form]);

  const addAttribute = () => {
    setAttributes((prev) => ({ ...prev, [`key-${Date.now()}`]: "" }));
  };

  const removeAttribute = (key: string) => {
    setAttributes((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const updateAttribute = (key: string, value: string) => {
    setAttributes((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (pricingMode === "stable") {
      replaceVariations([]);
    }
  }, [pricingMode, replaceVariations]);

  const onSubmit = (data: ProductFormValues) => {
    if (pricingMode === "variation" && (!data.variations || data.variations.length === 0)) {
      form.setError("variations", {
        type: "manual",
        message: t("products.addAtLeastOneVariation"),
      });
      return;
    }
    const finalData: Omit<Product, "id" | "category"> = {
      ...data,
      price: data.price ?? 0,
      rentalPrice: data.rentalPrice !== undefined ? data.rentalPrice : undefined,
      variations: pricingMode === "variation" ? data.variations || [] : [],
      attributes,
      image: data.image || "",
    };
    handleAddProduct(finalData);
    form.reset();
    setAttributes({});
    setGeneratedBarcode("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t("products.addNewProduct")}</DialogTitle>
          <DialogDescription>
            {t("products.addNewProductDesc")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">{t("products.basicInfo")}</TabsTrigger>
                <TabsTrigger value="details">{t("products.details")}</TabsTrigger>
                <TabsTrigger value="advanced">{t("products.advanced")}</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("products.productNameLabel")} <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={t("products.enterProductName")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("products.sellingPrice")}{" "}
                          <span className="text-muted-foreground text-xs font-normal">{t("products.optional")}</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) => {
                              const v = e.target.value;
                              field.onChange(v === "" ? undefined : (parseFloat(v) || 0));
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {t("products.leaveEmptyRentOnly")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("products.stock")} <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormItem>
                  <FormLabel>{t("products.pricingSetup")}</FormLabel>
                  <Select
                    value={pricingMode}
                    onValueChange={(value) =>
                      setPricingMode(value === "variation" ? "variation" : "stable")
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("products.selectPricingSetup")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="stable">{t("products.stableSinglePrice")}</SelectItem>
                      <SelectItem value="variation">
                        {t("products.variationsPricing")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("products.stableVariationDesc")}
                  </FormDescription>
                </FormItem>

                <FormField
                  control={form.control}
                  name="saleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("products.sellingMethod")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("products.selectSellingMethod")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="item">{t("products.perItem")}</SelectItem>
                          <SelectItem value="weight">{t("products.byWeight")}</SelectItem>
                          <SelectItem value="rental">{t("products.rental")}</SelectItem>
                          <SelectItem value="item_and_rental">{t("products.rentAndSale")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("products.chooseQuantitiesCashier")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unitLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("products.unitLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("products.unitPlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("products.unitLabelDesc")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitIncrement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("products.quantityStep")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {t("products.quantityStepDesc")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("products.category")} <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("products.selectCategoryPlaceholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("products.barcodePlaceholder")}</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder={t("products.barcodePlaceholder")}
                            {...field}
                            value={generatedBarcode || field.value || ""}
                            onChange={(e) => {
                              setGeneratedBarcode(e.target.value);
                              field.onChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const barcode = Math.random()
                              .toString(36)
                              .substring(2, 12)
                              .toUpperCase();
                            setGeneratedBarcode(barcode);
                            form.setValue("barcode", barcode);
                          }}
                        >
                          {t("products.generate")}
                        </Button>
                      </div>
                      <FormDescription>
                        {t("products.barcodeOptionalDesc")}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("products.description")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("products.descriptionPlaceholder")}
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("products.descriptionOptionalDesc")}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("products.productImage")}</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("products.imageOptionalDesc")}
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("reports.sku")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("reports.sku")} {...field} />
                        </FormControl>
                        <FormDescription>
                          {t("products.skuOptionalDesc")}
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("inventory.cost")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {t("products.costOptionalDesc")}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="taxable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("products.taxableLabel")}</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "true")
                        }
                        value={field.value ? "true" : "false"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("products.selectTaxablePlaceholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">{t("common.yes")}</SelectItem>
                          <SelectItem value="false">{t("common.no")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("products.taxableDesc")}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("products.taxRateLabel")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {t("products.taxRateOptionalDesc")}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("products.tags")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("products.tagsPlaceholderLong")}
                          {...field}
                          value={
                            Array.isArray(field.value)
                              ? field.value.join(", ")
                              : ""
                          }
                          onChange={(e) => {
                            const tags = e.target.value
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter((tag) => tag.length > 0);
                            field.onChange(tags);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("products.tagsOptionalDesc")}
                      </FormDescription>
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                {pricingMode === "variation" && (
                  <FormField
                    control={form.control}
                    name="variations"
                    render={() => (
                      <FormItem>
                        <FormLabel>{t("products.productVariations")}</FormLabel>
                        <FormDescription>
                          {t("products.variationsDesc")}
                        </FormDescription>
                        <div className="space-y-4">
                          {variationFields.map((field, index) => (
                            <div
                              key={field.id}
                              className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg bg-muted/50"
                            >
                              <FormField
                                control={form.control}
                                name={`variations.${index}.name`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormLabel>{t("products.variationName")}</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={t("products.variationPlaceholder")}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variations.${index}.price`}
                                render={({ field }) => (
                                  <FormItem className="w-full">
                                    <FormLabel>{t("products.sellPrice")}</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variations.${index}.rentalPrice`}
                                render={({ field }) => (
                                  <FormItem className="w-full">
                                    <FormLabel>{t("products.rentalPriceLabel")}</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variations.${index}.stock`}
                                render={({ field }) => (
                                  <FormItem className="w-full">
                                    <FormLabel>{t("products.stock")}</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="md:mt-8"
                                onClick={() => removeVariation(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              addVariation({
                                id: Date.now().toString(),
                                name: "",
                                price: 0,
                                rentalPrice: 0,
                                stock: 0,
                              })
                            }
                            className="w-full"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {t("products.addVariation")}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormItem>
                  <FormLabel>{t("products.customAttributes")}</FormLabel>
                  <FormDescription>
                    {t("products.customAttributesDesc")}
                  </FormDescription>
                  <div className="space-y-3">
                    {Object.entries(attributes).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex gap-2 p-3 border rounded-lg bg-muted/50"
                      >
                        <Input
                          value={key.replace("key-", "")}
                          readOnly
                          className="flex-1 bg-background"
                        />
                        <Input
                          value={value}
                          onChange={(e) => updateAttribute(key, e.target.value)}
                          placeholder={t("products.valuePlaceholder")}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAttribute(key)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addAttribute}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("products.addAttribute")}
                    </Button>
                  </div>
                </FormItem>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                  setAttributes({});
                  setGeneratedBarcode("");
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("products.addProductButton")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
