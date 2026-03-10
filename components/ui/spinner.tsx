"use client";

import * as React from "react"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useLanguage } from "@/components/language-provider"

function Spinner({ className, "aria-label": ariaLabel, ...props }: React.ComponentProps<"svg"> & { "aria-label"?: string }) {
  const { t } = useLanguage();
  return (
    <Loader2Icon
      role="status"
      aria-label={ariaLabel ?? t("common.loadingAria")}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
