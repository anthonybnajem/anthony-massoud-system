import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-white/60 bg-white/40 text-slate-700 hover:bg-white/60",
        secondary:
          "border-white/50 bg-white/30 text-slate-600 hover:bg-white/50",
        destructive:
          "accent-red-border-40 accent-red-bg-20 accent-red-text hover:accent-red-bg-30",
        outline: "border-white/60 text-slate-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
