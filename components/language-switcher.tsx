"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

type LanguageSwitcherVariant = "default" | "compact" | "iconOnly";

interface LanguageSwitcherProps {
  variant?: LanguageSwitcherVariant;
  showTooltip?: boolean;
  className?: string;
}

export function LanguageSwitcher({
  variant = "default",
  showTooltip = true,
  className,
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLanguage();

  const toggleLanguage = () => {
    setLocale(locale === "en" ? "ar" : "en");
  };

  const nextLocale = locale === "en" ? "ar" : "en";
  const tooltipLabel =
    nextLocale === "ar"
      ? t("common.arabic")
      : t("common.english");

  const button = (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className={cn(
        "shrink-0 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        variant === "default" && "h-9 w-9",
        (variant === "compact" || variant === "iconOnly") && "h-8 w-8",
        className
      )}
      aria-label={t("common.language")}
      title={tooltipLabel}
    >
      <Globe className="h-4 w-4" />
    </Button>
  );

  const content = showTooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {t("common.language")} · {tooltipLabel}
      </TooltipContent>
    </Tooltip>
  ) : (
    button
  );

  return <div className={cn("flex items-center", className)}>{content}</div>;
}
