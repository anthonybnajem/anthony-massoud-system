"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/35 group-[.toaster]:text-slate-700 group-[.toaster]:border-white/50 group-[.toaster]:shadow-[0_16px_32px_rgba(15,23,42,0.16)] group-[.toaster]:backdrop-blur-[18px]",
          description: "group-[.toast]:text-slate-500",
          actionButton:
            "group-[.toast]:accent-green-bg group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-white/30 group-[.toast]:text-slate-600",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
