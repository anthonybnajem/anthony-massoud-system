"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Save } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface LanguageSettingsProps {
  language: string;
  onLanguageChange: (language: string) => void;
  onSave: () => void;
}

export function LanguageSettings({
  language,
  onLanguageChange,
  onSave,
}: LanguageSettingsProps) {
  const { t } = useLanguage();

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-primary" />
          {t("common.language")}
        </CardTitle>
        <CardDescription>
          {t("settings.languageDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="settings-language" className="text-sm font-medium">
            {t("settings.languageLabel")}
          </Label>
          <Select
            value={language}
            onValueChange={(value) => onLanguageChange(value)}
          >
            <SelectTrigger id="settings-language" className="border-2 max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("common.english")}</SelectItem>
              <SelectItem value="ar">{t("common.arabic")}</SelectItem>
            </SelectContent>
          </Select>
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
