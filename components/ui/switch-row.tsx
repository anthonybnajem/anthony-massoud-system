"use client";

import * as React from "react";
import { useLanguage } from "@/components/language-provider";
import { useLayoutDirection } from "@/components/layout-direction-context";
import { cn } from "@/lib/utils";

/**
 * RTL-aware row for a label (or label block) and a Switch.
 * Keeps the switch at the end of the row (right in LTR). When the dashboard forces
 * dir="ltr" for Arabic, we do not reverse so the switch stays on the right.
 * Use switchFirst when the Switch is the first child (e.g. Switch then Label).
 */
interface SwitchRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Set to true when children order is [Switch, Label] so RTL does not reverse. */
  switchFirst?: boolean;
}

const SwitchRow = React.forwardRef<HTMLDivElement, SwitchRowProps>(
  ({ className, switchFirst, ...props }, ref) => {
    const { dir } = useLanguage();
    const layoutDir = useLayoutDirection();
    // Only reverse when locale is RTL and we're not in the dashboard's forced-LTR block.
    // In the dashboard (Arabic), layoutDir is "ltr", so we don't reverse → switch stays right.
    const shouldReverse = dir === "rtl" && layoutDir !== "ltr" && !switchFirst;
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between gap-3",
          shouldReverse && "flex-row-reverse",
          className
        )}
        {...props}
      />
    );
  }
);
SwitchRow.displayName = "SwitchRow";

export { SwitchRow };
