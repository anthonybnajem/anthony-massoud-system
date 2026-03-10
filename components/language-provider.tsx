"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import type { Locale } from "@/lib/translations";

// Ensure i18n is initialized (and dir/lang applied) when this provider runs on the client.
import "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const locale = (
    i18n.language === "ar" || (typeof i18n.language === "string" && i18n.language.startsWith("ar"))
      ? "ar"
      : "en"
  ) as Locale;
  const setLocale = useCallback(
    (lng: Locale) => {
      i18n.changeLanguage(lng);
    },
    [i18n]
  );
  const dir = locale === "ar" ? "rtl" : "ltr";

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, setLocale, t, dir }),
    [locale, setLocale, t, dir]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
