"use client";

import type React from "react";
import Script from "next/script";
import "@/app/globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { DatabaseInitializer } from "@/components/database-initializer";
import { PosDataProvider } from "@/components/pos-data-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DiscountProvider } from "@/components/discount-provider";
import { AuthProvider } from "@/components/auth-provider";
import { themeColors } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"] });

// Set dir/lang from stored locale before first paint (avoids flash when Arabic is selected)
const localeInitScript = `
(function(){
  try {
    var k = "pos-system:locale";
    var raw = localStorage.getItem(k);
    if (raw) {
      var l = JSON.parse(raw);
      var isAr = typeof l === "string" && (l === "ar" || l.indexOf("ar") === 0);
      if (isAr) {
        document.documentElement.setAttribute("dir", "rtl");
        document.documentElement.setAttribute("lang", "ar");
      } else {
        document.documentElement.setAttribute("dir", "ltr");
        document.documentElement.setAttribute("lang", "en");
      }
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        className={inter.className}
        style={
          {
            "--accent-green-hex": themeColors.accent.green.hex,
            "--accent-green-soft": themeColors.accent.green.soft,
            "--accent-green-glow": themeColors.accent.green.glow,
            "--accent-green-shadow": themeColors.accent.green.shadow,
            "--accent-black-hex": themeColors.accent.black.hex,
            "--accent-black-soft": themeColors.accent.black.soft,
            "--accent-black-glow": themeColors.accent.black.glow,
            "--accent-black-shadow": themeColors.accent.black.shadow,
            "--accent-purple-hex": themeColors.accent.purple.hex,
            "--accent-purple-shadow": themeColors.accent.purple.shadow,
            "--accent-blue-hex": themeColors.accent.blue.hex,
            "--accent-red-hex": themeColors.accent.red.hex,
            "--accent-red-text": themeColors.accent.red.textHex,
            "--accent-red-20": themeColors.accent.red.alpha20,
            "--accent-red-30": themeColors.accent.red.alpha30,
            "--accent-red-40": themeColors.accent.red.alpha40,
            "--accent-red-50": themeColors.accent.red.alpha50,
            "--accent-red-shadow": themeColors.accent.red.shadow,
            "--background": themeColors.semantic.background.hex,
            "--foreground": themeColors.semantic.foreground.hex,
            "--card": themeColors.semantic.card.hex,
            "--card-foreground": themeColors.semantic.cardForeground.hex,
            "--popover": themeColors.semantic.popover.hex,
            "--popover-foreground": themeColors.semantic.popoverForeground.hex,
            "--primary": themeColors.semantic.primary.hex,
            "--primary-foreground": themeColors.semantic.primaryForeground.hex,
            "--secondary": themeColors.semantic.secondary.hex,
            "--secondary-foreground": themeColors.semantic.secondaryForeground.hex,
            "--muted": themeColors.semantic.muted.hex,
            "--muted-foreground": themeColors.semantic.mutedForeground.hex,
            "--accent": themeColors.semantic.accent.hex,
            "--accent-foreground": themeColors.semantic.accentForeground.hex,
            "--destructive": themeColors.semantic.destructive.hex,
            "--destructive-foreground":
              themeColors.semantic.destructiveForeground.hex,
            "--border": themeColors.semantic.border.hex,
            "--input": themeColors.semantic.input.hex,
            "--ring": themeColors.semantic.ring.hex,
            "--chart-1": themeColors.semantic.chart1.hex,
            "--chart-2": themeColors.semantic.chart2.hex,
            "--chart-3": themeColors.semantic.chart3.hex,
            "--chart-4": themeColors.semantic.chart4.hex,
            "--chart-5": themeColors.semantic.chart5.hex,
            "--sidebar-background": themeColors.semantic.sidebarBackground.hex,
            "--sidebar-foreground": themeColors.semantic.sidebarForeground.hex,
            "--sidebar-primary": themeColors.semantic.sidebarPrimary.hex,
            "--sidebar-primary-foreground":
              themeColors.semantic.sidebarPrimaryForeground.hex,
            "--sidebar-accent": themeColors.semantic.sidebarAccent.hex,
            "--sidebar-accent-foreground":
              themeColors.semantic.sidebarAccentForeground.hex,
            "--sidebar-border": themeColors.semantic.sidebarBorder.hex,
            "--sidebar-ring": themeColors.semantic.sidebarRing.hex,
            "--type-greeting-size": themeColors.typography.greeting.size,
            "--type-greeting-weight": themeColors.typography.greeting.weight,
            "--type-greeting-color": themeColors.typography.greeting.color,
            "--type-section-size": themeColors.typography.section.size,
            "--type-section-weight": themeColors.typography.section.weight,
            "--type-section-color": themeColors.typography.section.color,
            "--type-kpi-size": themeColors.typography.kpi.size,
            "--type-kpi-weight": themeColors.typography.kpi.weight,
            "--type-kpi-color": themeColors.typography.kpi.color,
            "--type-kpi-letter-spacing":
              themeColors.typography.kpi.letterSpacing,
            "--type-secondary-size": themeColors.typography.secondary.size,
            "--type-secondary-weight": themeColors.typography.secondary.weight,
            "--type-secondary-color": themeColors.typography.secondary.color,
          } as React.CSSProperties
        }
      >
        <Script
          id="locale-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: localeInitScript,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
          <AuthProvider>
            <TooltipProvider delayDuration={0}>
              <DatabaseInitializer>
                <PosDataProvider>
                  <DiscountProvider>{children}</DiscountProvider>
                </PosDataProvider>
                <Toaster />
              </DatabaseInitializer>
            </TooltipProvider>
          </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
