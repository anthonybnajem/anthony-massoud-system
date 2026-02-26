"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"
import { themeColors } from "@/lib/theme"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2.5 w-full overflow-hidden rounded-full bg-white/30",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 transition-all duration-200 ease-in-out"
      style={{
        transform: `translateX(-${100 - (value || 0)}%)`,
        backgroundImage: `linear-gradient(90deg, ${themeColors.accent.green.hex}, ${themeColors.accent.green.soft})`,
        boxShadow: `0 0 14px ${themeColors.accent.green.glow}`,
      }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
