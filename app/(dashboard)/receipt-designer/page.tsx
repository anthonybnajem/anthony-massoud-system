"use client"

import { ReceiptDesigner } from "@/components/receipt-designer"
import { ReceiptSettingsProvider } from "@/components/receipt-settings-provider"
import { useLanguage } from "@/components/language-provider"

export default function ReceiptDesignerPage() {
  const { t } = useLanguage()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("header.receiptDesigner")}</h1>
        <p className="text-muted-foreground">{t("header.receiptDesignerDesc")}</p>
      </div>

      <ReceiptSettingsProvider>
        <ReceiptDesigner />
      </ReceiptSettingsProvider>
    </div>
  )
}
