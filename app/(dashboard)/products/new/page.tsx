"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePosData, type Product } from "@/components/pos-data-provider";
import { useLanguage } from "@/components/language-provider";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import Link from "next/link";
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

export default function NewProductPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const { categories, addNewProduct } = usePosData();
  const [generatedBarcode, setGeneratedBarcode] = useState("");

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

  const onSubmit = async (data: ProductFormValues) => {
    if (pricingMode === "variation" && (!data.variations || data.variations.length === 0)) {
      form.setError("variations", {
        type: "manual",
        message: t("products.addAtLeastOneVariation"),
      });
      return;
    }
    try {
      const finalData = {
        ...data,
        price: data.price ?? 0,
        rentalPrice: data.rentalPrice !== undefined ? data.rentalPrice : undefined,
        variations: pricingMode === "variation" ? data.variations || [] : [],
        attributes,
        image: data.image || "",
      };
      addNewProduct(finalData);

      toast({
        title: t("products.productCreated"),
        description: t("products.productCreatedDesc", { name: data.name }),
      });

      router.push("/products");
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: t("products.errorCreatingProduct"),
        description: t("products.errorCreatingProductDesc"),
        variant: "destructive",
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 overflow-hidden min-w-0"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="icon" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("products.createNewProduct")}
          </h1>
          <p className="text-muted-foreground">
            {t("products.createNewProductSubtitle")}
          </p>
        </div>
      </motion.div>

      {/* Form Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">
              {t("products.productInformation")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                    <TabsTrigger
                      value="basic"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      {t("products.basicInfo")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="details"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      {t("products.details")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="advanced"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      {t("products.advanced")}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("products.productNameLabel")}{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("products.enterProductName")}
                              {...field}
                              className="border-2 focus:border-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                className="border-2 focus:border-primary"
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
                        name="rentalPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("products.rentingPrice")}{" "}
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
                                className="border-2 focus:border-primary"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              {t("products.leaveEmptyNotRent")}
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
                                className="border-2 focus:border-primary"
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
                          setPricingMode(
                            value === "variation" ? "variation" : "stable"
                          )
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="border-2">
                            <SelectValue placeholder={t("products.selectPricingSetup")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="stable">
                            {t("products.stableSinglePrice")}
                          </SelectItem>
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
                              <SelectTrigger className="border-2">
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
                            {t("products.chooseQuantitiesDesc")}
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
                                className="border-2 focus:border-primary"
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
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="border-2 focus:border-primary"
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
                              <SelectTrigger className="border-2">
                                <SelectValue placeholder={t("products.selectCategoryPlaceholder")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                >
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
                                className="border-2 focus:border-primary"
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
                              className="gap-2"
                            >
                              <Plus className="h-4 w-4" />
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
                              className="min-h-[100px] border-2 focus:border-primary"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("reports.sku")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("reports.sku")}
                                {...field}
                                className="border-2 focus:border-primary"
                              />
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
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="border-2 focus:border-primary"
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
                              <SelectTrigger className="border-2">
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
                              className="border-2 focus:border-primary"
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
                              className="border-2 focus:border-primary"
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
                                          placeholder={t("products.variationNamePlaceholder")}
                                          {...field}
                                          className="border-2 focus:border-primary"
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
                                          className="border-2 focus:border-primary"
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
                                          className="border-2 focus:border-primary"
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
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="border-2 focus:border-primary"
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
                                className="w-full gap-2"
                              >
                                <Plus className="h-4 w-4" />
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
                              className="flex-1 bg-background border-2"
                            />
                            <Input
                              value={value}
                              onChange={(e) =>
                                updateAttribute(key, e.target.value)
                              }
                              placeholder={t("products.valuePlaceholder")}
                              className="flex-1 border-2 focus:border-primary"
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
                          className="w-full gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          {t("products.addAttribute")}
                        </Button>
                      </div>
                    </FormItem>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Link href="/products">
                    <Button type="button" variant="outline" className="gap-2">
                      {t("common.cancel")}
                    </Button>
                  </Link>
                  <Button type="submit" className="gap-2 shadow-sm">
                    <Save className="h-4 w-4" />
                    {t("products.createProduct")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
