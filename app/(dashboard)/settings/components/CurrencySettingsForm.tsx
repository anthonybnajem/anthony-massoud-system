"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Save } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface CurrencySettings {
  currencySymbol: string;
  currencyCode: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
}

interface CurrencyOption {
  symbol: string;
  code: string;
  name: string;
}

interface CurrencySettingsFormProps {
  settings: CurrencySettings;
  onSettingsChange: (settings: CurrencySettings) => void;
  onSave: () => void;
  currencyOptions: CurrencyOption[];
}

export function CurrencySettingsForm({
  settings,
  onSettingsChange,
  onSave,
  currencyOptions,
}: CurrencySettingsFormProps) {
  const { t } = useLanguage();
  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          {t("settings.currencyAndLocale")}
        </CardTitle>
        <CardDescription>
          {t("settings.currencyAndLocaleDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 max-w-xs">
          <Label htmlFor="currency" className="text-sm font-medium">
            {t("common.currency")}
          </Label>
          <Select
            value={settings.currencyCode}
            onValueChange={(value) => {
              const currency = currencyOptions.find((c) => c.code === value);
              if (currency) {
                onSettingsChange({
                  ...settings,
                  currencyCode: currency.code,
                  currencySymbol: currency.symbol,
                });
              }
            }}
          >
            <SelectTrigger id="currency" className="border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name} ({currency.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date-format" className="text-sm font-medium">
              {t("settings.dateFormat")}
            </Label>
            <Select
              value={settings.dateFormat}
              onValueChange={(value) =>
                onSettingsChange({ ...settings, dateFormat: value })
              }
            >
              <SelectTrigger id="date-format" className="border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                <SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time-format" className="text-sm font-medium">
              {t("settings.timeFormat")}
            </Label>
            <Select
              value={settings.timeFormat}
              onValueChange={(value) =>
                onSettingsChange({ ...settings, timeFormat: value })
              }
            >
              <SelectTrigger id="time-format" className="border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">{t("settings.timeFormat12h")}</SelectItem>
                <SelectItem value="24h">{t("settings.timeFormat24h")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/50">
        <Button onClick={onSave} className="gap-2 shadow-sm">
          <Save className="h-4 w-4" />
          {t("common.saveChanges")}
        </Button>
      </CardFooter>
    </Card>
  );
}
