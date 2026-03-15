"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  usePosData,
  type Product,
  type CartItem,
  type Sale,
} from "@/components/pos-data-provider";
import { useDiscount } from "@/components/discount-provider";
import { Badge } from "@/components/ui/badge";
import { Tag, ShoppingCart, Search, Package, BarChart, LayoutGrid, List } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { InvoicePrint } from "@/components/invoice-print";
import {
  ReceiptSettingsProvider,
  useReceiptSettings,
} from "@/components/receipt-settings-provider";
import DiscountDialog from "@/components/DiscountDialog";
import NotesDialog from "@/components/NotesDialog";
import CustomerDialog from "@/components/CustomerDialog";
import CheckoutDialog from "@/components/CheckoutDialog";
import { SearchBar } from "./components/SearchBar";
import { CategoryFilter } from "./components/CategoryFilter";
import { ProductTabs } from "./components/ProductTabs";
import { ProductCard } from "./components/ProductCard";
import { ProductCardRow } from "./components/ProductCardRow";
import { Cart } from "./components/Cart";
import { MobileCartButton } from "./components/MobileCartButton";
import {
  CustomLineItemDialog,
  type CustomLineDraft,
} from "./components/CustomLineItemDialog";
import { useBarcodeScanner } from "./hooks/useBarcodeScanner";
import { WeightQuantityDialog } from "./components/WeightQuantityDialog";
import { VariationSelectionDialog } from "./components/VariationSelectionDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsTablet } from "@/hooks/use-tablet";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getProductUnitPrice,
  getProductUnitPriceForVariation,
  formatQuantityWithLabel,
  isWeightBased,
} from "@/lib/product-measurements";
import {
  buildCustomersFromSales,
  type CustomerSummary,
} from "@/app/(dashboard)/customers/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

export type PosMode = "sale" | "expense";

export function PosPageContent({ mode }: { mode: PosMode }) {
  const { t } = useLanguage();
  const posData = usePosData();
  // Defensive: ensure arrays exist (avoids crashes in normal Chrome with bad cache/extensions)
  const products = Array.isArray(posData.products) ? posData.products : [];
  const categories = Array.isArray(posData.categories) ? posData.categories : [];
  const {
    sales,
    customers,
    projects,
    workers,
    services,
    addCustomerProfile,
    addCustomerProject,
    recordSale,
    recordExpense,
    employees,
    shifts,
    getActiveShiftForEmployee,
  } = posData;
  const { settings } = useReceiptSettings();
  const { discounts } = useDiscount();
  const taxRate = settings?.taxRate || 0;
  const currencySymbol = settings?.currencySymbol || "$";
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid" | "partially_paid">("paid");
  const [amountPaid, setAmountPaid] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [rentalStartDate, setRentalStartDate] = useState("");
  const [rentalEndDate, setRentalEndDate] = useState("");
  const [saleNotes, setSaleNotes] = useState("");
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const isExpenseMode = mode === "expense";
  const [activeSalesSection, setActiveSalesSection] = useState<
    "products" | "workers" | "services" | "custom"
  >("products");
  // When in expense mode, products are not available; ensure we're not on products tab
  useEffect(() => {
    if (isExpenseMode && activeSalesSection === "products") {
      setActiveSalesSection("workers");
    }
  }, [isExpenseMode, activeSalesSection]);
  const [activeTab, setActiveTab] = useState("all");
  const [productsViewMode, setProductsViewMode] = useState<"grid" | "row">("grid");
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState(0);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(
    null
  );
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [weightDialogProduct, setWeightDialogProduct] = useState<Product | null>(null);
  const [variationDialogProduct, setVariationDialogProduct] =
    useState<Product | null>(null);
  const [workerQuery, setWorkerQuery] = useState("");
  const [serviceQuery, setServiceQuery] = useState("");
  const [workerRateType, setWorkerRateType] = useState<
    Record<string, "day" | "hour">
  >({});
  const [isCustomLineDialogOpen, setIsCustomLineDialogOpen] = useState(false);
  const [customLineEditingId, setCustomLineEditingId] = useState<string | null>(
    null
  );
  const [customLineInitial, setCustomLineInitial] =
    useState<CustomLineDraft | null>(null);
  const customerDirectory = useMemo(
    () => buildCustomersFromSales(sales, customers),
    [sales, customers]
  );
  const selectedDiscount = useMemo(
    () =>
      selectedDiscountId
        ? discounts.find((discount) => discount.id === selectedDiscountId) ||
          null
        : null,
    [selectedDiscountId, discounts]
  );
  const customerProjects = useMemo(
    () => projects.filter((project) => project.customerId === selectedCustomerId),
    [projects, selectedCustomerId]
  );
  const filteredWorkers = useMemo(() => {
    const normalized = workerQuery.trim().toLowerCase();
    if (!normalized) return workers;
    return workers.filter((worker) => {
      return (
        worker.name.toLowerCase().includes(normalized) ||
        (worker.specialty || "").toLowerCase().includes(normalized) ||
        (worker.email || "").toLowerCase().includes(normalized) ||
        (worker.phone || "").toLowerCase().includes(normalized)
      );
    });
  }, [workers, workerQuery]);

  const filteredServices = useMemo(() => {
    const normalized = serviceQuery.trim().toLowerCase();
    if (!normalized) return services;
    return services.filter((service) => {
      return (
        service.name.toLowerCase().includes(normalized) ||
        (service.description || "").toLowerCase().includes(normalized)
      );
    });
  }, [services, serviceQuery]);

  const customCartItems = useMemo(
    () =>
      cart.filter(
        (item) => (item.customLine?.source || "custom") === "custom"
      ),
    [cart]
  );
  const hasRentalItemsInCart = useMemo(
    () => cart.some((item) => item.isRental === true),
    [cart]
  );
  useEffect(() => {
    if (selectedDiscountId && !selectedDiscount) {
      setSelectedDiscountId(null);
    }
  }, [selectedDiscountId, selectedDiscount]);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const router = useRouter();
  const isTablet = useIsTablet();

  // Get active shift for selected employee (or first active shift)
  const activeShift = getActiveShiftForEmployee(
    selectedEmployeeId || undefined
  );

  // Get all active shifts for employee selection
  const activeShifts = shifts.filter((s) => s.status === "active");
  const activeEmployeesWithShifts = activeShifts.map((shift) => {
    const employee = employees.find((e) => e.id === shift.employeeId);
    return { shift, employee: employee || null };
  });

  // Use barcode scanner hook
  useBarcodeScanner({
    products,
    onScanProduct: (scannedProduct) => {
      if ((scannedProduct.variations || []).length > 0) {
        setVariationDialogProduct(scannedProduct);
        return;
      }
      if (isWeightBased(scannedProduct)) {
        openWeightDialog(scannedProduct);
        return;
      }
      addProductToCart(scannedProduct, 1);
    },
  });

  // Filter products based on search query and category
  useEffect(() => {
    const list = Array.isArray(products) ? products : [];
    let filtered = [...list];

    // Apply category filter
    if (activeCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.categoryId === activeCategory
      );
    }

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          (product.category?.name &&
            product.category.name.toLowerCase().includes(query)) ||
          (product.barcode && product.barcode.toLowerCase().includes(query)) ||
          (product.sku && product.sku.toLowerCase().includes(query)) ||
          (product.description &&
            product.description.toLowerCase().includes(query))
      );
    }

    // Always set searchResults, even if empty (to show empty state)
    setSearchResults(filtered);
  }, [searchQuery, activeCategory, products]);

  const getCartLineUnitPrice = (item: CartItem) =>
    typeof item.unitPrice === "number"
      ? item.unitPrice
      : isExpenseMode
        ? (typeof item.product.cost === "number" ? item.product.cost : getProductUnitPrice(item.product))
        : getProductUnitPrice(item.product);

  const isLineTaxable = (item: CartItem) => {
    if (item.customLine) {
      return item.customLine.taxable === true;
    }
    return item.product.taxable !== false;
  };

  // Calculate cart subtotal
  const cartSubtotal = cart.reduce(
    (total, item) => total + getCartLineUnitPrice(item) * item.quantity,
    0
  );
  const discountAnalysis = useMemo(() => {
    if (!selectedDiscount) {
      const manualBase =
        discountType === "percentage"
          ? cartSubtotal * (discountValue / 100)
          : discountValue;
      const manualAmount = Math.min(Math.max(manualBase, 0), cartSubtotal);
      return {
        amount: manualAmount,
        eligibleSubtotal: cartSubtotal,
        eligibleMatchCount: cart.length,
      };
    }

    let eligibleSubtotal = 0;
    let eligibleMatchCount = 0;
    let amount = 0;

    const applyLineDiscount = (lineTotal: number, quantity: number) => {
      if (lineTotal <= 0) return;
      eligibleSubtotal += lineTotal;
      eligibleMatchCount += 1;
      let lineDiscount =
        selectedDiscount.type === "percentage"
          ? lineTotal * (selectedDiscount.value / 100)
          : selectedDiscount.value * quantity;
      lineDiscount = Math.min(lineDiscount, lineTotal);
      amount += lineDiscount;
    };

    if (selectedDiscount.appliesTo === "product") {
      cart.forEach((item) => {
        if (item.customLine) return;
        if (selectedDiscount.productIds?.includes(item.product.id)) {
          applyLineDiscount(
            getCartLineUnitPrice(item) * item.quantity,
            item.quantity
          );
        }
      });
    } else if (selectedDiscount.appliesTo === "category") {
      cart.forEach((item) => {
        if (item.customLine) return;
        if (
          item.product.categoryId &&
          selectedDiscount.categoryIds?.includes(item.product.categoryId)
        ) {
          applyLineDiscount(
            getCartLineUnitPrice(item) * item.quantity,
            item.quantity
          );
        }
      });
    } else {
      applyLineDiscount(cartSubtotal, 1);
    }

    if (selectedDiscount.maxDiscount) {
      amount = Math.min(amount, selectedDiscount.maxDiscount);
    }

    const cappedAmount = Math.min(
      Math.max(amount, 0),
      eligibleSubtotal || cartSubtotal
    );

    return {
      amount: cappedAmount,
      eligibleSubtotal,
      eligibleMatchCount,
    };
  }, [
    cart,
    cartSubtotal,
    discountType,
    discountValue,
    selectedDiscount,
  ]);

  const {
    amount: computedDiscountAmount,
    eligibleSubtotal: eligibleDiscountSubtotal,
    eligibleMatchCount: eligibleDiscountMatches,
  } = discountAnalysis;

  const savedDiscountError = useMemo(() => {
    if (!selectedDiscount) return null;
    if (!selectedDiscount.isActive) {
      return t("sales.discountInactive");
    }
    const now = new Date();
    if (
      selectedDiscount.startDate &&
      new Date(selectedDiscount.startDate) > now
    ) {
      return t("sales.discountNotAvailableYet");
    }
    if (selectedDiscount.endDate && new Date(selectedDiscount.endDate) < now) {
      return t("sales.discountExpired");
    }
    if (
      selectedDiscount.usageLimit &&
      selectedDiscount.usageCount >= selectedDiscount.usageLimit
    ) {
      return t("sales.usageLimitReached");
    }
    if (
      (selectedDiscount.appliesTo === "product" ||
        selectedDiscount.appliesTo === "category") &&
      eligibleDiscountMatches === 0
    ) {
      return t("sales.discountDoesNotApply");
    }
    const thresholdSubtotal =
      selectedDiscount.appliesTo === "product" ||
      selectedDiscount.appliesTo === "category"
        ? eligibleDiscountSubtotal
        : cartSubtotal;
    if (
      selectedDiscount.minOrderAmount &&
      thresholdSubtotal < selectedDiscount.minOrderAmount
    ) {
      return `${t("sales.requiresMinOrder")} ${currencySymbol}${selectedDiscount.minOrderAmount.toFixed(
        2
      )}`;
    }
    return null;
  }, [
    t,
    selectedDiscount,
    eligibleDiscountMatches,
    eligibleDiscountSubtotal,
    cartSubtotal,
    currencySymbol,
  ]);

  const discountAmount =
    selectedDiscount && savedDiscountError
      ? 0
      : computedDiscountAmount;

  const taxableSubtotal = cart.reduce(
    (total, item) =>
      total +
      (isLineTaxable(item) ? getCartLineUnitPrice(item) * item.quantity : 0),
    0
  );

  // Calculate tax
  const taxAmount = (taxableSubtotal - discountAmount) * (taxRate / 100);

  // Calculate total
  const cartTotal = cartSubtotal - discountAmount + taxAmount;

  // In expense mode, tax is always zero so the expense total is not increased by tax
  const effectiveTaxRate = isExpenseMode ? 0 : taxRate;
  const effectiveTaxAmount = isExpenseMode ? 0 : taxAmount;
  const effectiveCartTotal = isExpenseMode
    ? cartSubtotal - discountAmount
    : cartTotal;
  const appliedDiscountLabel = useMemo(() => {
    if (selectedDiscount) {
      if (savedDiscountError) {
        return `${selectedDiscount.name} ${t("sales.notEligible")}`;
      }
      const matchDetails =
        (selectedDiscount.appliesTo === "product" ||
          selectedDiscount.appliesTo === "category") &&
        eligibleDiscountMatches > 0
          ? `${eligibleDiscountMatches} ${eligibleDiscountMatches === 1 ? t("sales.matchingItem") : t("sales.matchingItems")}`
          : null;
      return matchDetails
        ? `${selectedDiscount.name} (${matchDetails})`
        : selectedDiscount.name;
    }
    if (discountAmount > 0) {
      return discountType === "percentage"
        ? `${discountValue}% off`
        : `${currencySymbol}${discountValue.toFixed(2)} off`;
    }
    return undefined;
  }, [
    t,
    selectedDiscount,
    savedDiscountError,
    discountAmount,
    discountType,
    discountValue,
    currencySymbol,
    eligibleDiscountMatches,
  ]);
  const appliedDiscountId =
    selectedDiscount && !savedDiscountError ? selectedDiscount.id : undefined;
  const effectiveDiscountType =
    selectedDiscount && !savedDiscountError
      ? selectedDiscount.type
      : discountType;
  const effectiveDiscountValue =
    selectedDiscount && !savedDiscountError
      ? selectedDiscount.value
      : discountValue;

  // Calculate cart item count
  const cartItemCount = cart.length;

  const getLineUnitPrice = (
    product: Product,
    {
      variationId,
      isRental,
    }: {
      variationId?: string;
      isRental?: boolean;
    } = {}
  ): number => {
    const variation = variationId
      ? product.variations?.find((item) => item.id === variationId)
      : undefined;
    const rentalMode =
      typeof isRental === "boolean"
        ? isRental
        : product.saleType === "rental";
    if (rentalMode) {
      if (variation && typeof variation.rentalPrice === "number") {
        return variation.rentalPrice;
      }
      if (typeof product.rentalPrice === "number") {
        return product.rentalPrice;
      }
      return variation?.price ?? product.price;
    }
    if (variation && typeof variation.price === "number") {
      return variation.price;
    }
    return product.price;
  };

  const getDefaultRentalWindow = () => {
    const now = new Date();
    const start = now.toISOString().slice(0, 16);
    const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const end = endDate.toISOString().slice(0, 16);
    return { start, end };
  };

  // Add product to cart
  const addProductToCart = (
    product: Product,
    quantity = 1,
    options?: {
      variationId?: string;
      variationName?: string;
      unitPrice?: number;
      maxStock?: number;
      isRental?: boolean;
      rentalStartDate?: string;
      rentalEndDate?: string;
    }
  ) => {
    if (isExpenseMode) {
      const lineId = `${product.id}::${options?.variationId || "base"}::expense`;
      const lineUnitPrice =
        typeof options?.unitPrice === "number"
          ? options.unitPrice
          : (typeof product.cost === "number" ? product.cost : getProductUnitPrice(product));
      setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.id === lineId);
        if (existingItem) {
          return prevCart.map((item) =>
            item.id === lineId ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [
          ...prevCart,
          {
            id: lineId,
            product,
            variationId: options?.variationId,
            variationName: options?.variationName,
            unitPrice: lineUnitPrice,
            quantity,
            isRental: false,
          },
        ];
      });
      toast({
        title: t("sales.addedToCart"),
        description: `${formatQuantityWithLabel(product, quantity)} ${product.name}${
          options?.variationName ? ` (${options.variationName})` : ""
        } ${t("sales.addedToCartDesc")}`,
      });
      if (isMobile && cart.length === 0) setIsCartOpen(true);
      return;
    }

    const availableStock = options?.maxStock ?? product.stock;
    if (availableStock <= 0) {
      toast({
        title: t("sales.outOfStock"),
        description: `${product.name}${
          options?.variationName ? ` (${options.variationName})` : ""
        } ${t("sales.outOfStockDesc")}`,
        variant: "destructive",
      });
      return;
    }

    const isRental = options?.isRental ?? product.saleType === "rental";
    const defaultRentalWindow = getDefaultRentalWindow();
    const lineRentalStartDate =
      options?.rentalStartDate || rentalStartDate || defaultRentalWindow.start;
    const lineRentalEndDate =
      options?.rentalEndDate || rentalEndDate || defaultRentalWindow.end;
    const lineId = `${product.id}::${options?.variationId || "base"}::${
      isRental ? "rental" : "sale"
    }`;
    const lineUnitPrice =
      typeof options?.unitPrice === "number"
        ? options.unitPrice
        : getLineUnitPrice(product, {
            variationId: options?.variationId,
            isRental,
          });

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === lineId);

      if (existingItem) {
        // Check if we have enough stock
        if (existingItem.quantity + quantity > availableStock) {
          const nameStr = `${product.name}${options?.variationName ? ` (${options.variationName})` : ""}`;
          toast({
            title: t("sales.stockLimitReached"),
            description: t("sales.stockLimitDesc")
              .replace("{qty}", formatQuantityWithLabel(product, availableStock))
              .replace("{name}", nameStr),
            variant: "destructive",
          });
          return prevCart;
        }

        return prevCart.map((item) =>
          item.id === lineId
            ? {
                ...item,
                quantity: item.quantity + quantity,
                rentalStartDate:
                  item.rentalStartDate || (isRental ? lineRentalStartDate : undefined),
                rentalEndDate:
                  item.rentalEndDate || (isRental ? lineRentalEndDate : undefined),
              }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            id: lineId,
            product,
            variationId: options?.variationId,
            variationName: options?.variationName,
            unitPrice: lineUnitPrice,
            quantity,
            isRental,
            rentalStartDate: isRental ? lineRentalStartDate : undefined,
            rentalEndDate: isRental ? lineRentalEndDate : undefined,
          },
        ];
      }
    });

    toast({
      title: t("sales.addedToCart"),
      description: `${formatQuantityWithLabel(product, quantity)} ${product.name}${
        options?.variationName ? ` (${options.variationName})` : ""
      } ${t("sales.addedToCartDesc")}`,
    });

    // Auto-open cart drawer on mobile when item is added
    if (isMobile && cart.length === 0) {
      setIsCartOpen(true);
    }
  };

  const openWeightDialog = (product: Product) => {
    if (!isExpenseMode && product.stock <= 0) {
      toast({
        title: t("sales.outOfStock"),
        description: `${product.name} ${t("sales.outOfStockDesc")}`,
        variant: "destructive",
      });
      return;
    }
    setWeightDialogProduct(product);
  };

  const handleProductSelection = (product: Product) => {
    if (isWeightBased(product)) {
      openWeightDialog(product);
      return;
    }
    // Always open the selection form (variation/quantity) for non-weight products
    setVariationDialogProduct(product);
  };

  // Update cart item quantity
  const updateQuantity = (lineId: string, newQuantity: number) => {
    const targetLine = cart.find((item) => item.id === lineId);
    if (!targetLine) return;
    if (targetLine.customLine) {
      if (newQuantity <= 0) {
        removeFromCart(lineId);
        return;
      }
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === lineId ? { ...item, quantity: newQuantity } : item
        )
      );
      return;
    }
    const variation = targetLine.variationId
      ? targetLine.product.variations?.find(
          (item) => item.id === targetLine.variationId
        )
      : undefined;
    const maxStock = Math.min(
      targetLine.product.stock,
      variation?.stock ?? targetLine.product.stock
    );

    if (newQuantity > maxStock) {
      const nameStr = `${targetLine.product.name}${targetLine.variationName ? ` (${targetLine.variationName})` : ""}`;
      toast({
        title: t("sales.stockLimitReached"),
        description: t("sales.stockLimitDesc")
          .replace("{qty}", formatQuantityWithLabel(targetLine.product, maxStock))
          .replace("{name}", nameStr),
        variant: "destructive",
      });
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(lineId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === lineId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Remove from cart
  const removeFromCart = (lineId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== lineId));
  };

  const setItemRentalMode = (lineId: string, isRental: boolean) => {
    setCart((prevCart) => {
      const current = prevCart.find((item) => item.id === lineId);
      if (!current || current.isRental === isRental) return prevCart;
      if (current.customLine) return prevCart;

      const modeSuffix = isRental ? "rental" : "sale";
      const nextId = `${current.product.id}::${
        current.variationId || "base"
      }::${modeSuffix}`;

      const variation = current.variationId
        ? current.product.variations?.find(
            (entry) => entry.id === current.variationId
          )
        : undefined;
      const maxStock = Math.min(
        current.product.stock,
        variation?.stock ?? current.product.stock
      );

      const sameModeItem = prevCart.find((item) => item.id === nextId);
      if (sameModeItem) {
        const mergedQty = sameModeItem.quantity + current.quantity;
        if (mergedQty > maxStock + 0.0001) {
          toast({
            title: t("sales.stockLimitReached"),
            description: t("sales.stockLimitMergeDesc")
              .replace("{qty}", formatQuantityWithLabel(current.product, mergedQty))
              .replace("{avail}", formatQuantityWithLabel(current.product, maxStock)),
            variant: "destructive",
          });
          return prevCart;
        }
        return prevCart
          .map((item) => {
            if (item.id === sameModeItem.id) {
              return {
                ...item,
                quantity: mergedQty,
                unitPrice: getLineUnitPrice(item.product, {
                  variationId: item.variationId,
                  isRental,
                }),
              };
            }
            return item;
          })
          .filter((item) => item.id !== lineId);
      }

      return prevCart.map((item) => {
        if (item.id !== lineId) return item;
        const defaultRentalWindow = getDefaultRentalWindow();
        return {
          ...item,
          id: nextId,
          isRental,
          unitPrice: getLineUnitPrice(item.product, {
            variationId: item.variationId,
            isRental,
          }),
          rentalStartDate: isRental
            ? item.rentalStartDate || rentalStartDate || defaultRentalWindow.start
            : undefined,
          rentalEndDate: isRental
            ? item.rentalEndDate || rentalEndDate || defaultRentalWindow.end
            : undefined,
        };
      });
    });
  };

  const setItemRentalDates = (
    lineId: string,
    rentalDates: { rentalStartDate?: string; rentalEndDate?: string }
  ) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === lineId
          ? {
              ...item,
              rentalStartDate:
                rentalDates.rentalStartDate ?? item.rentalStartDate,
              rentalEndDate: rentalDates.rentalEndDate ?? item.rentalEndDate,
            }
          : item
      )
    );
  };

  const customCategory = useMemo(
    () => ({
      id: "custom",
      name: t("sales.customServiceName"),
      description: t("sales.customLineItemsLabel"),
    }),
    [t]
  );

  const buildCustomProduct = useCallback(
    (line: CustomLineDraft, id: string): Product => ({
      id,
      name: line.name,
      price: line.price,
      rentalPrice: undefined,
      category: customCategory as any,
      categoryId: customCategory.id,
      image: "",
      stock: 999999,
      barcode: undefined,
      description: line.notes,
      sku: undefined,
      cost: undefined,
      taxable: line.taxable,
      taxRate: undefined,
      tags: ["custom"],
      attributes: {
        serviceType: line.serviceType || "",
        workerName: line.workerName || "",
      },
      variations: [],
      saleType: "item",
      unitLabel: line.unitLabel || "service",
      unitIncrement: 1,
    }),
    [customCategory]
  );

  const appendCustomLine = (line: CustomLineDraft) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `custom-${crypto.randomUUID()}`
        : `custom-${Date.now()}`;
    const customProduct = buildCustomProduct(line, id);
    setCart((prev) => [
      ...prev,
      {
        id,
        product: customProduct,
        unitPrice: line.price,
        quantity: line.quantity,
        isCustom: true,
        customLine: {
          name: line.name,
          price: line.price,
          source: line.source || "custom",
          workerId: line.workerId,
          workerName: line.workerName,
          serviceType: line.serviceType,
          notes: line.notes,
          taxable: line.taxable,
        },
      },
    ]);
  };

  const handleSaveCustomLine = (line: CustomLineDraft) => {
    if (customLineEditingId) {
      setCart((prev) =>
        prev.map((item) => {
          if (item.id !== customLineEditingId) return item;
          const nextProduct = {
            ...item.product,
            name: line.name,
            price: line.price,
            taxable: line.taxable,
            unitLabel: line.unitLabel || item.product.unitLabel,
          };
          return {
            ...item,
            product: nextProduct,
            unitPrice: line.price,
            quantity: line.quantity,
            isCustom: true,
            customLine: {
              name: line.name,
              price: line.price,
              source: line.source || "custom",
              workerId: line.workerId,
              workerName: line.workerName,
              serviceType: line.serviceType,
              notes: line.notes,
              taxable: line.taxable,
            },
          };
        })
      );
    } else {
      appendCustomLine(line);
    }
    setIsCustomLineDialogOpen(false);
    setCustomLineEditingId(null);
    setCustomLineInitial(null);
  };

  const openAddCustomLine = () => {
    setCustomLineEditingId(null);
    setCustomLineInitial(null);
    setIsCustomLineDialogOpen(true);
  };

  const openEditCustomLine = (lineId: string) => {
    const target = cart.find((item) => item.id === lineId);
    if (!target?.customLine) return;
    setCustomLineEditingId(lineId);
    setCustomLineInitial({
      name: target.customLine.name,
      price: target.customLine.price,
      quantity: target.quantity,
      workerId: target.customLine.workerId,
      workerName: target.customLine.workerName,
      serviceType: target.customLine.serviceType,
      notes: target.customLine.notes,
      taxable: target.customLine.taxable ?? true,
      source: target.customLine.source || "custom",
      unitLabel: target.product.unitLabel,
    });
    setIsCustomLineDialogOpen(true);
  };

  const addWorkerLine = (
    worker: (typeof workers)[number],
    rateType: "day" | "hour"
  ) => {
    const rate =
      rateType === "hour"
        ? Number(worker.hourlyRate || 0)
        : Number(worker.dailyRate || 0);
    if (rateType === "hour" && rate <= 0) {
      toast({
        title: t("sales.hourlyRateMissing"),
        description: `${worker.name} ${t("sales.hourlyRateMissingDesc")}`,
        variant: "destructive",
      });
      return;
    }
    appendCustomLine({
      name: `${t("sales.laborPrefix")}${worker.name}`,
      price: rate,
      quantity: 1,
      workerId: worker.id,
      workerName: worker.name,
      serviceType:
        rateType === "hour"
          ? `${worker.specialty || t("sales.labor")} ${t("sales.laborHourly")}`
          : `${worker.specialty || t("sales.labor")} ${t("sales.laborDaily")}`,
      notes: worker.notes,
      taxable: false,
      unitLabel: rateType === "hour" ? "hour" : "day",
      source: "worker",
    });
  };

  const addServiceLine = (service: (typeof services)[number]) => {
    const fallbackUnit =
      service.billingType === "per_day"
        ? "day"
        : service.billingType === "per_count"
        ? "service"
        : "service";
    appendCustomLine({
      name: service.name,
      price: Number(service.price) || 0,
      quantity: 1,
      workerId: undefined,
      workerName: undefined,
      serviceType: service.billingType.replace("_", " "),
      notes: service.description,
      taxable: service.taxable === true,
      unitLabel: service.unitLabel || fallbackUnit,
      source: "service",
    });
  };

  const handleUpdateCustomLine = (
    lineId: string,
    updates: {
      name: string;
      price: number;
      quantity: number;
      workerId?: string;
      workerName?: string;
      serviceType?: string;
      notes?: string;
      taxable?: boolean;
      unitLabel?: string;
      source?: "custom" | "worker" | "service";
    }
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== lineId) return item;
        const nextProduct = {
          ...item.product,
          name: updates.name,
          price: updates.price,
          taxable: updates.taxable ?? item.product.taxable,
          unitLabel: updates.unitLabel || item.product.unitLabel,
          description: updates.notes || item.product.description,
        };
        return {
          ...item,
          product: nextProduct,
          unitPrice: updates.price,
          quantity: updates.quantity,
          isCustom: true,
          customLine: {
            name: updates.name,
            price: updates.price,
            source:
              updates.source || item.customLine?.source || "custom",
            workerId: updates.workerId,
            workerName: updates.workerName,
            serviceType: updates.serviceType,
            notes: updates.notes,
            taxable: updates.taxable,
          },
        };
      })
    );
  };

  const applyRentalDatesToAll = useCallback(() => {
    if (!rentalStartDate || !rentalEndDate) return;
    setCart((prevCart) => {
      let changed = false;
      const nextCart = prevCart.map((item) => {
        if (!item.isRental) return item;
        if (
          item.rentalStartDate === rentalStartDate &&
          item.rentalEndDate === rentalEndDate
        ) {
          return item;
        }
        changed = true;
        return {
          ...item,
          rentalStartDate,
          rentalEndDate,
        };
      });
      return changed ? nextCart : prevCart;
    });
  }, [rentalStartDate, rentalEndDate]);

  // Clear the entire cart
  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setSelectedDiscountId(null);
    setSaleNotes("");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerLocation("");
    setSelectedCustomerId("");
    setSelectedProjectId("");
    setRentalStartDate("");
    setRentalEndDate("");
    toast({
      title: t("sales.cartCleared"),
      description: t("sales.cartClearedDesc"),
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: t("sales.emptyCart"),
        description: t("sales.emptyCartDesc"),
        variant: "destructive",
      });
      return;
    }

    if (!isExpenseMode && hasRentalItemsInCart) {
      if (!selectedCustomerId) {
        toast({
          title: t("sales.customerRequired"),
          description: t("sales.customerRequiredDesc"),
          variant: "destructive",
        });
        return;
      }
      if (!selectedProjectId) {
        toast({
          title: t("sales.projectRequiredTitle"),
          description: t("sales.projectRequired"),
          variant: "destructive",
        });
        return;
      }
      const invalidRentalLine = cart.find((item) => {
        if (!item.isRental) return false;
        const lineStart = item.rentalStartDate || rentalStartDate;
        const lineEnd = item.rentalEndDate || rentalEndDate;
        if (!lineStart || !lineEnd) return true;
        const start = new Date(lineStart);
        const end = new Date(lineEnd);
        return (
          Number.isNaN(start.getTime()) ||
          Number.isNaN(end.getTime()) ||
          end <= start
        );
      });
      if (invalidRentalLine) {
        toast({
          title: t("sales.invalidRentalDates"),
          description: t("sales.invalidRentalDatesDesc"),
          variant: "destructive",
        });
        return;
      }
    }

    // Validate active shift exists
    // if (!activeShift) {
    //   toast({
    //     title: "No Active Shift",
    //     description:
    //       "Please ensure an employee is clocked in before making a sale.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    try {
      if (isExpenseMode) {
        const expenseItems = cart.map((item) => {
          const unitCost = getCartLineUnitPrice(item);
          if (!item.customLine) {
            return {
              id: item.id,
              type: "product" as const,
              productId: item.product.id,
              description: item.product.name,
              quantity: item.quantity,
              unitCost,
              total: unitCost * item.quantity,
            };
          }
          const source = item.customLine?.source;
          const type =
            source === "worker"
              ? ("worker" as const)
              : source === "service"
                ? ("service" as const)
                : ("custom" as const);
          return {
            id: item.id,
            type,
            workerId: item.customLine?.workerId,
            serviceId: undefined,
            description: item.customLine?.name || item.product.name,
            quantity: item.quantity,
            unitCost,
            total: unitCost * item.quantity,
          };
        });
        await recordExpense({
          items: expenseItems,
          total: effectiveCartTotal > 0 ? -Math.abs(effectiveCartTotal) : effectiveCartTotal,
          paymentMethod,
          vendor: customerName.trim() || undefined,
          notes: saleNotes.trim() || undefined,
          expenseType: "expense_out",
          paymentStatus,
          amountPaid: paymentStatus === "partially_paid" ? amountPaid : undefined,
        });
        setIsCheckoutOpen(false);
        setCart([]);
        setPaymentMethod("cash");
        setPaymentStatus("paid");
        setAmountPaid(0);
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setCustomerLocation("");
        setSelectedCustomerId("");
        setSelectedProjectId("");
        setRentalStartDate("");
        setRentalEndDate("");
        setSaleNotes("");
        setDiscountValue(0);
        setSelectedDiscountId(null);
      } else {
        // Prepare the sale data with the format expected by IndexedDB
        const rentalItems = cart.filter((item) => item.isRental === true);
        const saleData = {
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: getCartLineUnitPrice(item),
            variationId: item.variationId,
            variationName: item.variationName,
            isRental: item.isRental === true,
            rentalStartDate:
              item.isRental && (item.rentalStartDate || rentalStartDate)
                ? new Date(item.rentalStartDate || rentalStartDate)
                : undefined,
            rentalEndDate:
              item.isRental && (item.rentalEndDate || rentalEndDate)
                ? new Date(item.rentalEndDate || rentalEndDate)
                : undefined,
            isCustom: item.isCustom === true,
            customLine: item.customLine,
            product: item.product,
          })),
          subtotal: cartSubtotal,
          tax: effectiveTaxAmount,
          discount: discountAmount,
          discountType: effectiveDiscountType,
          discountId: appliedDiscountId,
          total: effectiveCartTotal,
          paymentMethod,
          customerId: selectedCustomerId || undefined,
          projectId: selectedProjectId || undefined,
          rentalStartDate:
            rentalItems.length > 0
              ? new Date(
                  rentalItems
                    .map((item) => item.rentalStartDate || rentalStartDate)
                    .filter((date): date is string => Boolean(date))
                    .sort()[0]
                )
              : undefined,
          rentalEndDate:
            rentalItems.length > 0
              ? new Date(
                  rentalItems
                    .map((item) => item.rentalEndDate || rentalEndDate)
                    .filter((date): date is string => Boolean(date))
                    .sort()
                    .slice(-1)[0]
                )
              : undefined,
          customerName: customerName.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          customerLocation: customerLocation.trim() || undefined,
          notes: saleNotes.trim() || undefined,
          paymentStatus,
          amountPaid: paymentStatus === "partially_paid" ? amountPaid : undefined,
        };

        const sale = await recordSale(
          saleData,
          selectedEmployeeId || undefined,
          activeShift?.id
        );

        setCompletedSale(sale);
        setIsCheckoutOpen(false);
        setIsInvoiceOpen(true);
        setCart([]);
        setPaymentMethod("cash");
        setPaymentStatus("paid");
        setAmountPaid(0);
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setCustomerLocation("");
        setSelectedCustomerId("");
        setSelectedProjectId("");
        setRentalStartDate("");
        setRentalEndDate("");
        setSaleNotes("");
        setDiscountValue(0);
        setSelectedDiscountId(null);
      }
    } catch (error) {
      console.error(isExpenseMode ? "Error recording expense:" : "Error recording sale:", error);
      toast({
        title: t("common.error"),
        description: isExpenseMode ? t("sales.expenseFailed") : t("sales.failedToCompleteSale"),
        variant: "destructive",
      });
    }
  };

  // Quick add: same as card click – always open the selection form for non-weight products
  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (isWeightBased(product)) {
      openWeightDialog(product);
      return;
    }
    setVariationDialogProduct(product);
  };

  const handleWeightConfirm = (quantity: number) => {
    if (!weightDialogProduct) return;
    const sellP = getProductUnitPrice(weightDialogProduct, false);
    const rentP = getProductUnitPrice(weightDialogProduct, true);
    const isRentalOnly = rentP > 0 && sellP <= 0;
    addProductToCart(weightDialogProduct, quantity, {
      isRental: weightDialogProduct.saleType === "rental" || isRentalOnly,
    });
    setWeightDialogProduct(null);
  };

  const handleWeightDialogClose = () => {
    setWeightDialogProduct(null);
  };

  const handleVariationConfirm = (
    variationId: string,
    quantity: number,
    isRental: boolean
  ) => {
    if (!variationDialogProduct) return;
    const hasVariations = (variationDialogProduct.variations?.length ?? 0) > 0;
    const variation =
      hasVariations && variationId
        ? variationDialogProduct.variations?.find((item) => item.id === variationId)
        : null;

    const linePrice =
      isExpenseMode && typeof variationDialogProduct.cost === "number"
        ? variationDialogProduct.cost
        : variation
          ? getProductUnitPriceForVariation(
              variationDialogProduct,
              variation,
              isRental
            )
          : getProductUnitPrice(variationDialogProduct, isRental);

    addProductToCart(variationDialogProduct, quantity, {
      ...(variation
        ? {
            variationId: variation.id,
            variationName: variation.name,
            maxStock: Math.min(
              variationDialogProduct.stock,
              variation.stock
            ),
          }
        : {
            maxStock: variationDialogProduct.stock,
          }),
      unitPrice: linePrice,
      ...(isExpenseMode
        ? {}
        : {
            isRental:
              variationDialogProduct.saleType === "rental" || isRental,
          }),
    });
    setVariationDialogProduct(null);
  };

  const handleVariationDialogClose = () => {
    setVariationDialogProduct(null);
  };

  // Apply discount
  const applyDiscount = () => {
    setIsDiscountDialogOpen(false);

    if (selectedDiscount) {
      if (savedDiscountError) {
        toast({
          title: t("sales.discountUnavailable"),
          description: savedDiscountError,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("sales.discountApplied"),
          description: (isExpenseMode
            ? t("expenses.discountAppliedToExpenseDesc")
            : t("sales.discountAppliedToSaleDesc")
          ).replace("{name}", selectedDiscount.name),
        });
      }
      return;
    }

    if (discountValue > 0) {
      const valueStr =
        discountType === "percentage"
          ? discountValue + "%"
          : currencySymbol + discountValue.toFixed(2);
      toast({
        title: t("sales.discountApplied"),
        description: t("sales.discountAppliedToCartDesc").replace(
          "{value}",
          valueStr
        ),
      });
    }
  };

  // Save notes
  const saveNotes = () => {
    setIsNotesDialogOpen(false);

    if (saleNotes.trim()) {
      toast({
        title: t("sales.notesSaved"),
        description: isExpenseMode ? t("expenses.notesSavedDesc") : t("sales.notesSavedDesc"),
      });
    }
  };

  const handleSavedDiscountSelect = (discountId: string) => {
    setSelectedDiscountId(discountId);
  };

  const handleSavedDiscountClear = () => {
    setSelectedDiscountId(null);
  };

  const handleCustomerSelection = (customer: CustomerSummary) => {
    setSelectedCustomerId(customer.profileId || "");
    setSelectedProjectId("");
    if (!customer.defaultDiscountId) return;
    const discountRecord = discounts.find(
      (discount) => discount.id === customer.defaultDiscountId
    );
    if (discountRecord) {
      setSelectedDiscountId(discountRecord.id);
      toast({
        title: t("sales.customerDiscountApplied"),
        description: t("sales.usingDiscountForCustomer")
          .replace("{discount}", discountRecord.name)
          .replace("{customer}", customer.name),
      });
    } else {
      toast({
        title: t("sales.discountUnavailable"),
        description: t("sales.customerDiscountNotFound"),
        variant: "destructive",
      });
      setSelectedDiscountId(null);
    }
  };

  // Save customer info
  const saveCustomerInfo = () => {
    setIsCustomerDialogOpen(false);

    if (customerName || customerEmail || customerPhone || customerLocation) {
      toast({
        title: t("sales.customerInfoSaved"),
        description: isExpenseMode ? t("expenses.customerInfoSavedDesc") : t("sales.customerInfoSavedDesc"),
      });
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <ReceiptSettingsProvider>
     
      <div
        className={`flex h-full w-full ${isMobile ? "flex-col" : "flex-row"} ${
          isTablet ? "gap-3" : "gap-4"
        } overflow-hidden min-w-0 p-3 sm:p-4 md:p-6`}
      >
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Bar with Search and Categories */}
          <div className="space-y-3 mb-4">
            {/* Cart Summary Bar with Sidebar Toggle */}
             
            <div
              className={`card ${isMobile ? "p-3" : isTablet ? "p-3" : "p-4"}`}
            >
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <SidebarTrigger className="h-9 w-9 shrink-0" aria-label={t("common.toggleSidebar")} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-xs sm:text-sm truncate max-w-[140px] sm:max-w-none"
                    onClick={() => router.push("/receipts")}
                  >
                    {t("sales.viewRecentReceipts")}
                  </Button>
                </div>

                {/* Active Shift Indicator / Employee Selector */}
                {activeShifts.length > 0 ? (
                  activeShifts.length === 1 ? (
                    <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md bg-green-500/10 border border-green-500/20 min-w-0 shrink">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-400 truncate">
                        {activeShifts[0].employeeId
                          ? employees.find(
                              (e) => e.id === activeShifts[0].employeeId
                            )?.name || t("sales.shiftActive")
                          : t("sales.shiftActive")}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto sm:min-w-0">
                      <Select
                        value={selectedEmployeeId}
                        onValueChange={setSelectedEmployeeId}
                      >
                        <SelectTrigger className="h-8 w-full min-w-0 max-w-[140px] sm:max-w-none sm:w-[180px] border-2 border-primary/20 bg-background">
                          <SelectValue placeholder={t("sales.selectEmployee")} />
                        </SelectTrigger>
                        <SelectContent>
                          {activeEmployeesWithShifts.map(
                            ({ shift, employee }) => (
                              <SelectItem
                                key={shift.id}
                                value={shift.employeeId}
                              >
                                {employee?.name || t("sales.unknown")} - {t("sales.activeSuffix")}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                ) : (
                  <div></div>
               
                  // <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive/10 border border-destructive/20">
                  //   <div className="h-2 w-2 rounded-full bg-destructive" />
                  //   <span className="text-xs font-medium text-destructive">
                  //     No Active Shift
                  //   </span>
                  // </div>
                )}

                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 basis-full sm:basis-auto sm:flex-initial justify-end">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-primary/20 rounded-lg shrink-0">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {t("sales.cartItems")}
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                        {cartItemCount} {cartItemCount === 1 ? t("cart.item") : t("cart.items")}
                      </p>
                    </div>
                  </div>
                  <div className="h-6 sm:h-8 w-px bg-border shrink-0" aria-hidden />
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-primary/20 rounded-lg shrink-0">
                      <Tag className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{t("sales.total")}</p>
                      <p className="text-base sm:text-lg font-bold text-primary truncate">
                        {currencySymbol}
                        {effectiveCartTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>

            <div className={`card ${isMobile ? "p-3" : isTablet ? "p-3" : "p-4"}`}>
              <Tabs
                value={activeSalesSection}
                onValueChange={(value) =>
                  setActiveSalesSection(
                    value as "products" | "workers" | "services" | "custom"
                  )
                }
                className="w-full min-w-0"
              >
                <TabsList className={`grid w-full min-w-0 h-10 sm:h-11 text-xs sm:text-sm ${isExpenseMode ? "grid-cols-3" : "grid-cols-4"}`}>
                  {!isExpenseMode && (
                    <TabsTrigger value="products" className="min-w-0 truncate px-2 sm:px-4">{t("sales.products")}</TabsTrigger>
                  )}
                  <TabsTrigger value="workers" className="min-w-0 truncate px-2 sm:px-4">{t("sales.workers")}</TabsTrigger>
                  <TabsTrigger value="services" className="min-w-0 truncate px-2 sm:px-4">{t("sales.services")}</TabsTrigger>
                  <TabsTrigger value="custom" className="min-w-0 truncate px-2 sm:px-4">{t("sales.addCustom")}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {!isExpenseMode && activeSalesSection === "products" && (
              <div className={`card ${isTablet ? "p-4" : "p-5"}`}>
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  isTablet={isTablet}
                />

                {/* Horizontal Category Navigation + Grid/Row toggle */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <CategoryFilter
                      categories={categories}
                      activeCategory={activeCategory}
                      onCategoryChange={(id) => setActiveCategory(id)}
                      isTablet={isTablet}
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0" role="group" aria-label={t("expenses.viewGrid")}>
                    <Button
                      type="button"
                      variant={productsViewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      className="h-9 px-2.5"
                      onClick={() => setProductsViewMode("grid")}
                      title={t("expenses.viewGrid")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={productsViewMode === "row" ? "default" : "outline"}
                      size="sm"
                      className="h-9 px-2.5"
                      onClick={() => setProductsViewMode("row")}
                      title={t("expenses.viewRow")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeSalesSection === "workers" && (
              <div className={`card ${isTablet ? "p-4" : "p-5"}`}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  <Input
                    placeholder={t("sales.searchWorkersPlaceholder")}
                    value={workerQuery}
                    onChange={(event) => setWorkerQuery(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            {activeSalesSection === "services" && (
              <div className={`card ${isTablet ? "p-4" : "p-5"}`}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  <Input
                    placeholder={t("sales.searchServicesPlaceholder")}
                    value={serviceQuery}
                    onChange={(event) => setServiceQuery(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}
          </div>
        
          {!isExpenseMode && activeSalesSection === "products" && (
            <ProductTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              viewMode={productsViewMode}
              renderItem={(product) => (
                <ProductCard
                  product={product}
                  currencySymbol={currencySymbol}
                  onAddToCart={handleProductSelection}
                  onQuickAdd={handleQuickAdd}
                  variants={searchResults.length <= 20 ? itemVariants : undefined}
                  isTablet={isTablet}
                />
              )}
              renderItemRow={(product) => (
                <ProductCardRow
                  product={product}
                  currencySymbol={currencySymbol}
                  onAddToCart={handleProductSelection}
                  onQuickAdd={handleQuickAdd}
                  isTablet={isTablet}
                />
              )}
              tabs={[
                {
                  value: "all",
                  label: t("sales.all"),
                  items: searchResults,
                  emptyState: (
                    <div className="flex items-center justify-center h-full min-h-[400px]">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </EmptyMedia>
                          <EmptyTitle>{t("sales.noProductsFound")}</EmptyTitle>
                          <EmptyDescription>
                            {searchQuery || activeCategory !== "all"
                              ? t("sales.tryAdjustingSearch")
                              : products.length === 0
                              ? t("sales.noProductsAvailable")
                              : t("sales.loadingProducts")}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </div>
                  ),
                },
                {
                  value: "popular",
                  label: t("sales.popular"),
                  items: searchResults
                    .slice()
                    .sort((a, b) => b.stock - a.stock)
                    .slice(0, 10),
                  emptyState: (
                    <div className="flex items-center justify-center h-full min-h-[400px]">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </EmptyMedia>
                          <EmptyTitle>{t("sales.noProductsFound")}</EmptyTitle>
                          <EmptyDescription>
                            {searchQuery || activeCategory !== "all"
                              ? t("sales.tryAdjustingSearch")
                              : products.length === 0
                              ? t("sales.noProductsAvailable")
                              : t("sales.loadingProducts")}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </div>
                  ),
                },
                {
                  value: "recent",
                  label: t("sales.recent"),
                  items: searchResults.slice().reverse().slice(0, 10),
                  emptyState: (
                    <div className="flex items-center justify-center h-full min-h-[400px]">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </EmptyMedia>
                          <EmptyTitle>{t("sales.noProductsFound")}</EmptyTitle>
                          <EmptyDescription>
                            {searchQuery || activeCategory !== "all"
                              ? t("sales.tryAdjustingSearch")
                              : products.length === 0
                              ? t("sales.noProductsAvailable")
                              : t("sales.loadingProducts")}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </div>
                  ),
                },
                {
                  value: "favorites",
                  label: t("sales.favorites"),
                  items: [],
                  emptyState: (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <BarChart className="h-12 w-12 text-muted-foreground" />
                          </EmptyMedia>
                          <EmptyTitle>{t("sales.favoritesComingSoon")}</EmptyTitle>
                          <EmptyDescription>
                            {t("sales.favoritesComingSoonDesc")}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </div>
                  ),
                },
              ]}
              getKey={(product) => product.id}
              containerVariants={containerVariants}
              isTablet={isTablet}
            />
          )}

          {activeSalesSection === "workers" && (
            <ProductTabs
              activeTab="all"
              onTabChange={() => {}}
              showTabs={false}
              className="card p-4 overflow-hidden flex flex-col min-h-0"
              contentClassName="flex-1 overflow-auto p-0 min-h-0"
              tabs={[
                {
                  value: "all",
                  label: t("sales.all"),
                  items: filteredWorkers,
                  emptyState: (
                    <div className="text-sm text-slate-500">
                      {t("sales.noWorkersFound")}
                    </div>
                  ),
                  gridClassName: "grid gap-3 md:grid-cols-2 lg:grid-cols-3",
                },
              ]}
              renderItem={(worker) => (
                <div className="card p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {worker.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {worker.specialty || t("sales.labor")}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={
                          (workerRateType[worker.id] || "day") === "day"
                            ? "default"
                            : "outline"
                        }
                        className="h-7 px-2 text-[11px]"
                        onClick={() =>
                          setWorkerRateType((prev) => ({
                            ...prev,
                            [worker.id]: "day",
                          }))
                        }
                      >
                        {t("sales.perDay")}
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          (workerRateType[worker.id] || "day") === "hour"
                            ? "default"
                            : "outline"
                        }
                        className="h-7 px-2 text-[11px]"
                        onClick={() =>
                          setWorkerRateType((prev) => ({
                            ...prev,
                            [worker.id]: "hour",
                          }))
                        }
                      >
                        {t("sales.perHour")}
                      </Button>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-semibold text-slate-700">
                      {currencySymbol}
                      {(
                        (workerRateType[worker.id] || "day") === "hour"
                          ? Number(worker.hourlyRate || 0)
                          : Number(worker.dailyRate || 0)
                      ).toFixed(2)}
                    </p>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        addWorkerLine(worker, workerRateType[worker.id] || "day")
                      }
                    >
                      {t("sales.add")}
                    </Button>
                  </div>
                </div>
              )}
              getKey={(worker) => worker.id}
            />
          )}

          {activeSalesSection === "services" && (
            <ProductTabs
              activeTab="all"
              onTabChange={() => {}}
              showTabs={false}
              className="card p-4 overflow-hidden flex flex-col min-h-0"
              contentClassName="flex-1 overflow-auto p-0 min-h-0"
              tabs={[
                {
                  value: "all",
                  label: t("sales.all"),
                  items: filteredServices,
                  emptyState: (
                    <div className="text-sm text-slate-500">
                      {t("sales.noServicesFound")}
                    </div>
                  ),
                  gridClassName: "grid gap-3 md:grid-cols-2 lg:grid-cols-3",
                },
              ]}
              renderItem={(service) => (
                <div className="card p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {service.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {service.billingType}
                      {service.unitLabel ? `· ${service.unitLabel}` : ""}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-semibold text-slate-700">
                      {currencySymbol}
                      {Number(service.price || 0).toFixed(2)}
                    </p>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => addServiceLine(service)}
                    >
                      {t("sales.add")}
                    </Button>
                  </div>
                </div>
              )}
              getKey={(service) => service.id}
            />
          )}

          {activeSalesSection === "custom" && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {t("sales.customLineItems")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t("sales.customLineItemsDesc")}
                  </p>
                </div>
                <Button onClick={openAddCustomLine}>{t("sales.addCustom")}</Button>
              </div>
              <ProductTabs
                activeTab="all"
                onTabChange={() => {}}
                showTabs={false}
                className="flex flex-col min-h-0"
                contentClassName="flex-1 overflow-auto p-0 min-h-0"
                tabs={[
                  {
                    value: "all",
                    label: t("sales.all"),
                    items: customCartItems,
                    emptyState: (
                      <p className="text-sm text-slate-500">
                        {t("sales.noCustomItemsYet")}
                      </p>
                    ),
                    gridClassName: "grid gap-3 md:grid-cols-2",
                  },
                ]}
                renderItem={(item) => (
                  <div className="card p-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {item.customLine?.name || item.product.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {item.customLine?.serviceType || t("checkout.custom")} •{" "}
                        {item.customLine?.workerName || t("sales.noWorker")}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-semibold text-slate-700">
                        {currencySymbol}
                        {(getCartLineUnitPrice(item) * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        size="sm"
                        className="mt-2"
                        variant="outline"
                        onClick={() => openEditCustomLine(item.id)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                )}
                getKey={(item) => item.id}
              />
            </div>
          )}
        </div>

        {/* Cart Section - Desktop/Tablet: Sidebar, Mobile: Drawer */}
        {!isMobile && (
          <Cart
            cart={cart}
            cartItemCount={cartItemCount}
            cartSubtotal={cartSubtotal}
            discountValue={effectiveDiscountValue}
            discountType={effectiveDiscountType}
            discountAmount={discountAmount}
            discountLabel={appliedDiscountLabel}
            taxRate={effectiveTaxRate}
            taxAmount={effectiveTaxAmount}
            cartTotal={effectiveCartTotal}
            currencySymbol={currencySymbol}
            onClearCart={clearCart}
            onUpdateQuantity={updateQuantity}
            onToggleRentalMode={setItemRentalMode}
            onUpdateRentalDates={setItemRentalDates}
            onUpdateCustomLine={handleUpdateCustomLine}
            onRemoveFromCart={removeFromCart}
            onDiscountClick={() => setIsDiscountDialogOpen(true)}
            onNotesClick={() => setIsNotesDialogOpen(true)}
            onCustomerClick={() => setIsCustomerDialogOpen(true)}
            onAddCustomLine={openAddCustomLine}
            onCheckoutClick={() => setIsCheckoutOpen(true)}
            containerVariants={containerVariants}
            itemVariants={itemVariants}
            workers={workers}
            isMobile={false}
            isTablet={isTablet}
            isExpenseMode={isExpenseMode}
          />
        )}

        {/* Mobile Cart Drawer */}
        {isMobile && (
          <Cart
            cart={cart}
            cartItemCount={cartItemCount}
            cartSubtotal={cartSubtotal}
            discountValue={effectiveDiscountValue}
            discountType={effectiveDiscountType}
            discountAmount={discountAmount}
            discountLabel={appliedDiscountLabel}
            taxRate={effectiveTaxRate}
            taxAmount={effectiveTaxAmount}
            cartTotal={effectiveCartTotal}
            currencySymbol={currencySymbol}
            onClearCart={clearCart}
            onUpdateQuantity={updateQuantity}
            onToggleRentalMode={setItemRentalMode}
            onUpdateRentalDates={setItemRentalDates}
            onUpdateCustomLine={handleUpdateCustomLine}
            onRemoveFromCart={removeFromCart}
            onDiscountClick={() => setIsDiscountDialogOpen(true)}
            onNotesClick={() => setIsNotesDialogOpen(true)}
            onCustomerClick={() => setIsCustomerDialogOpen(true)}
            onAddCustomLine={openAddCustomLine}
            onCheckoutClick={() => setIsCheckoutOpen(true)}
            containerVariants={containerVariants}
            itemVariants={itemVariants}
            workers={workers}
            isMobile={true}
            isOpen={isCartOpen}
            onOpenChange={setIsCartOpen}
            isExpenseMode={isExpenseMode}
          />
        )}

        {/* Mobile Cart Button */}
        {isMobile && (
          <MobileCartButton
            cartItemCount={cartItemCount}
            cartTotal={effectiveCartTotal}
            currencySymbol={currencySymbol}
            onClick={() => setIsCartOpen(true)}
          />
        )}

        {/* Discount Dialog */}
        <DiscountDialog
          isOpen={isDiscountDialogOpen}
          onClose={() => setIsDiscountDialogOpen(false)}
          discountType={discountType}
          setDiscountType={setDiscountType}
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
          discountAmount={discountAmount}
          cartTotal={effectiveCartTotal}
          currencySymbol={currencySymbol}
          applyDiscount={applyDiscount}
          savedDiscounts={discounts}
          selectedDiscountId={selectedDiscountId}
          onSelectSavedDiscount={handleSavedDiscountSelect}
          onClearSavedDiscount={handleSavedDiscountClear}
          appliedDiscount={selectedDiscount}
          savedDiscountError={savedDiscountError}
        />

        {/* Notes Dialog */}
        <NotesDialog
          isOpen={isNotesDialogOpen}
          onClose={() => setIsNotesDialogOpen(false)}
          saleNotes={saleNotes}
          setSaleNotes={setSaleNotes}
          saveNotes={saveNotes}
        />

        {/* Customer Dialog */}
      <CustomerDialog
          isOpen={isCustomerDialogOpen}
          onClose={() => setIsCustomerDialogOpen(false)}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerEmail={customerEmail}
          setCustomerEmail={setCustomerEmail}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          customerLocation={customerLocation}
          setCustomerLocation={setCustomerLocation}
          saveCustomerInfo={saveCustomerInfo}
          existingCustomers={customerDirectory}
          availableDiscounts={discounts}
          onCustomerSelect={handleCustomerSelection}
          selectedCustomerId={selectedCustomerId}
          onCustomerIdChange={setSelectedCustomerId}
          selectedProjectId={selectedProjectId}
          onProjectIdChange={setSelectedProjectId}
          projects={customerProjects}
          showProjects={hasRentalItemsInCart}
          onAddProject={addCustomerProject}
          onSaveProfile={async ({
            name,
            email,
            phone,
            location,
            defaultDiscountId,
          }) => {
            const profile = await addCustomerProfile({
              name,
              email,
              phone,
              location,
              defaultDiscountId,
            });
            setSelectedCustomerId(profile.id);
            setSelectedProjectId("");
            if (defaultDiscountId) {
              setSelectedDiscountId(defaultDiscountId);
            }
            toast({
              title: t("sales.customerSaved"),
              description: (isExpenseMode ? t("expenses.customerSavedDesc") : t("sales.customerSavedDesc")).replace(
                "{name}",
                profile.name
              ),
            });
          }}
        />

        <CustomLineItemDialog
          isOpen={isCustomLineDialogOpen}
          title={customLineEditingId ? t("sales.editCustomLine") : t("sales.addCustomItem")}
          workers={workers}
          initialValue={customLineInitial}
          onClose={() => setIsCustomLineDialogOpen(false)}
          onSave={handleSaveCustomLine}
        />

        {/* Checkout Dialog */}
        <CheckoutDialog
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          customerName={customerName}
          customerEmail={customerEmail}
          customerPhone={customerPhone}
          setIsCustomerDialogOpen={setIsCustomerDialogOpen}
          hasRentalItems={hasRentalItemsInCart}
          rentalStartDate={rentalStartDate}
          rentalEndDate={rentalEndDate}
          setRentalStartDate={setRentalStartDate}
          setRentalEndDate={setRentalEndDate}
          onApplyRentalDatesToAll={applyRentalDatesToAll}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          paymentStatus={paymentStatus}
          setPaymentStatus={setPaymentStatus}
          amountPaid={amountPaid}
          setAmountPaid={setAmountPaid}
          cartSubtotal={cartSubtotal}
          discountValue={effectiveDiscountValue}
          discountType={effectiveDiscountType}
          discountAmount={discountAmount}
          discountLabel={appliedDiscountLabel}
          taxRate={effectiveTaxRate}
          taxAmount={effectiveTaxAmount}
          cartTotal={effectiveCartTotal}
          receiptItems={cart.map((item) => ({
            id: item.id,
            name: item.customLine?.name || item.product.name,
            variationName: item.variationName,
            quantity: item.quantity,
            unitLabel: item.product.unitLabel,
            stock:
              item.variationId
                ? item.product.variations?.find(
                    (variation) => variation.id === item.variationId
                  )?.stock ?? item.product.stock
                : item.product.stock,
            unitPrice: getCartLineUnitPrice(item),
            isRental: item.isRental === true,
            rentalStartDate: item.rentalStartDate,
            rentalEndDate: item.rentalEndDate,
            lineTotal: getCartLineUnitPrice(item) * item.quantity,
            isCustom: item.isCustom === true,
            customLine: item.customLine,
            taxable: isLineTaxable(item),
          }))}
          onReceiptItemRentalDatesChange={setItemRentalDates}
          onReceiptItemQuantityChange={updateQuantity}
          onReceiptItemModeChange={setItemRentalMode}
          onReceiptItemCustomUpdate={handleUpdateCustomLine}
          onReceiptItemRemove={removeFromCart}
          onAddCustomLine={openAddCustomLine}
          workers={workers}
          currencySymbol={currencySymbol}
          handleCheckout={handleCheckout}
        />

        <WeightQuantityDialog
          product={weightDialogProduct}
          isOpen={Boolean(weightDialogProduct)}
          onClose={handleWeightDialogClose}
          onConfirm={handleWeightConfirm}
          currencySymbol={currencySymbol}
        />

        <VariationSelectionDialog
          product={variationDialogProduct}
          isOpen={Boolean(variationDialogProduct)}
          onClose={handleVariationDialogClose}
          onConfirm={handleVariationConfirm}
          currencySymbol={currencySymbol}
        />

        {/* Invoice Print Dialog (sale mode only) */}
        {!isExpenseMode && completedSale && (
          <InvoicePrint
            sale={completedSale}
            isOpen={isInvoiceOpen}
            onClose={() => setIsInvoiceOpen(false)}
          />
        )}
      </div>
    </ReceiptSettingsProvider>
  );
}
