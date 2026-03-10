import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";
import type { Discount } from "@/lib/db";

interface DiscountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  discountType: "percentage" | "fixed";
  setDiscountType: (type: "percentage" | "fixed") => void;
  discountValue: number;
  setDiscountValue: (value: number) => void;
  discountAmount: number;
  cartTotal: number;
  currencySymbol: string;
  applyDiscount: () => void;
  savedDiscounts: Discount[];
  selectedDiscountId: string | null;
  onSelectSavedDiscount: (discountId: string) => void;
  onClearSavedDiscount: () => void;
  appliedDiscount?: Discount | null;
  savedDiscountError?: string | null;
}

export default function DiscountDialog({
  isOpen,
  onClose,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  discountAmount,
  cartTotal,
  currencySymbol,
  applyDiscount,
  savedDiscounts,
  selectedDiscountId,
  onSelectSavedDiscount,
  onClearSavedDiscount,
  appliedDiscount,
  savedDiscountError,
}: DiscountDialogProps) {
  const { t } = useLanguage();
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("checkout.applyDiscountTitle")}</DialogTitle>
          <DialogDescription>
            {t("checkout.applyDiscountDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("checkout.savedDiscount")}</Label>
            <Select
              value={selectedDiscountId ?? "none"}
              onValueChange={(value) => {
                if (value === "none") {
                  onClearSavedDiscount();
                } else {
                  onSelectSavedDiscount(value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("checkout.chooseSavedDiscount")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("checkout.noSavedDiscount")}</SelectItem>
                {savedDiscounts.length === 0 ? (
                  <SelectItem value="placeholder" disabled>
                    {t("checkout.createDiscountInPage")}
                  </SelectItem>
                ) : (
                  savedDiscounts.map((discount) => (
                    <SelectItem key={discount.id} value={discount.id}>
                      {discount.name}
                      {discount.code ? ` (${discount.code})` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {appliedDiscount && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{appliedDiscount.type === "percentage" ? `${appliedDiscount.value}%` : `${currencySymbol}${appliedDiscount.value}`}</Badge>
                  <span className="font-medium">{appliedDiscount.name}</span>
                </div>
                {appliedDiscount.code && (
                  <p className="text-muted-foreground text-xs">
                    {t("checkout.codeLabel")}: {appliedDiscount.code}
                  </p>
                )}
                {savedDiscountError ? (
                  <p className="text-xs text-destructive">
                    {savedDiscountError}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("checkout.discountOverridesManual")}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="discount-type">{t("checkout.discountType")}</Label>
              <Tabs
                defaultValue={discountType}
                className="w-full"
                onValueChange={(value) => {
                  if (selectedDiscountId) return;
                  setDiscountType(value as "percentage" | "fixed");
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="percentage">{t("checkout.percentageTab")}</TabsTrigger>
                  <TabsTrigger value="fixed">{t("checkout.fixedAmountTab")}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="discount-value">
              {discountType === "percentage"
                ? t("checkout.discountPercentage")
                : t("checkout.discountAmountLabel")}
            </Label>
            <Input
              id="discount-value"
              type="number"
              min="0"
              max={discountType === "percentage" ? "100" : undefined}
              value={discountValue}
              onChange={(e) =>
                setDiscountValue(Number.parseFloat(e.target.value) || 0)
              }
              disabled={Boolean(selectedDiscountId)}
            />
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between font-medium">
              <span>{t("checkout.discountAmountValue")}</span>
              <span>
                {currencySymbol}
                {discountAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-medium mt-2">
              <span>{t("checkout.newTotal")}</span>
              <span>
                {currencySymbol}
                {cartTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={applyDiscount} disabled={Boolean(selectedDiscountId && savedDiscountError)}>
            {t("checkout.applyDiscountButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
