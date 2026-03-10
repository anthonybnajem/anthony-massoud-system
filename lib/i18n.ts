/**
 * Framework-agnostic i18n setup for react-i18next.
 * Safe to reuse in Electron: no Next.js or DOM-specific APIs in config.
 * Document dir/lang and persistence are applied only when running in a browser.
 *
 * For Electron: import this module and use the same resources (translations from
 * ./translations). To get one JSON file per language (e.g. for loading from disk),
 * run: npm run sync-locales
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { translations } from "./translations";
import {
  LOCAL_STORAGE_KEYS,
  getLocalStorageItem,
  setLocalStorageItem,
} from "./local-storage";

export type Locale = "en" | "ar";

const supportedLngs: Locale[] = ["en", "ar"];

function isArabic(lng: string | undefined): boolean {
  return lng === "ar" || (typeof lng === "string" && lng.startsWith("ar"));
}

function getInitialLanguage(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = getLocalStorageItem<string>(LOCAL_STORAGE_KEYS.LOCALE, "en");
  return isArabic(stored) ? "ar" : "en";
}

export const i18nInstance = i18n;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { ...translations.en } },
    ar: { translation: { ...translations.ar } },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  supportedLngs,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

/**
 * Apply document direction and lang. Call only in browser (e.g. after init or on language change).
 * Kept in this module so Electron can reuse the same logic when running in a window.
 */
export function applyDocumentDirection(lng: string): void {
  if (typeof document === "undefined") return;
  const ar = isArabic(lng);
  document.documentElement.lang = ar ? "ar" : "en";
  document.documentElement.dir = ar ? "rtl" : "ltr";
}

if (typeof window !== "undefined") {
  applyDocumentDirection(i18n.language);
  i18n.on("languageChanged", (lng: string) => {
    applyDocumentDirection(lng);
    setLocalStorageItem(
      LOCAL_STORAGE_KEYS.LOCALE,
      isArabic(lng) ? "ar" : "en"
    );
  });
}

export default i18n;
