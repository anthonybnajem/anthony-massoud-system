"use client"

import { useLanguage } from "@/components/language-provider"
import { DataExportImport } from "@/components/data-export-import"

export default function DataExportPage() {
  const { t } = useLanguage()
  return (
    <div className="space-y-6 overflow-hidden min-w-0">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{t("dataExport.title")}</h1>
        <p className="text-muted-foreground">{t("dataExport.subtitle")}</p>
      </div>

      <DataExportImport />
    </div>
  )
}
