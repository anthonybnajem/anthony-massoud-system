import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { themeColors } from "@/lib/theme"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] text-sm font-medium ring-offset-background transition-[color,background-color,box-shadow,filter] duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:text-slate-500 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-[0_10px_20px_var(--accent-black-shadow)] hover:brightness-105",
        destructive:
          "bg-destructive text-white shadow-[0_10px_20px_var(--accent-red-shadow)] hover:brightness-105",
        outline:
          "border-2 border-border bg-muted/80 text-foreground shadow-sm hover:bg-muted hover:text-foreground",
        secondary:
          "bg-[var(--accent-purple-hex)] text-white shadow-[0_10px_20px_var(--accent-purple-shadow)] hover:brightness-105",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = props.disabled ?? false
    const variantStyle: React.CSSProperties | undefined = isDisabled
      ? {
          backgroundColor: "#94A3B859",
          boxShadow: "none",
        }
      : variant === "default"
        ? {
            boxShadow: `0 10px 20px ${themeColors.accent.black.shadow}`,
          }
        : variant === "destructive"
          ? {
              boxShadow: `0 10px 20px ${themeColors.accent.red.shadow}`,
            }
          : variant === "secondary"
            ? {
                boxShadow: `0 10px 20px ${themeColors.accent.purple.shadow}`,
              }
            : undefined
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        style={variantStyle}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
