"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import {
  CheckCircle2,
  PlayCircle,
  BookOpenCheck,
  Settings,
  Wrench,
  Package2,
  ReceiptText,
} from "lucide-react";

const stepKeys = [
  { titleKey: "tutorial.step1Title", descKey: "tutorial.step1Desc", detailsKeys: null, link: "/settings" },
  { titleKey: "tutorial.step2Title", descKey: "tutorial.step2Desc", detailsKeys: ["tutorial.step2Detail1", "tutorial.step2Detail2"], link: "/categories" },
  { titleKey: "tutorial.step3Title", descKey: "tutorial.step3Desc", detailsKeys: ["tutorial.step3Detail1", "tutorial.step3Detail2"], link: "/products" },
  { titleKey: "tutorial.step4Title", descKey: "tutorial.step4Desc", detailsKeys: null, link: "/inventory" },
  { titleKey: "tutorial.step5Title", descKey: "tutorial.step5Desc", detailsKeys: null, link: "/receipt-designer" },
  { titleKey: "tutorial.step6Title", descKey: "tutorial.step6Desc", detailsKeys: null, link: "/sales" },
  { titleKey: "tutorial.step7Title", descKey: "tutorial.step7Desc", detailsKeys: null, link: "/reports" },
];

const sampleProductKeys = [
  { nameKey: "tutorial.sampleProduct1Name", unitKey: "tutorial.sampleProduct1Unit", noteKey: "tutorial.sampleProduct1Note" },
  { nameKey: "tutorial.sampleProduct2Name", unitKey: "tutorial.sampleProduct2Unit", noteKey: "tutorial.sampleProduct2Note" },
  { nameKey: "tutorial.sampleProduct3Name", unitKey: "tutorial.sampleProduct3Unit", noteKey: "tutorial.sampleProduct3Note" },
];

export default function TutorialPage() {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BookOpenCheck className="h-8 w-8 text-primary" />
            {t("tutorial.massoudTutorial")}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="h-4 w-4 text-primary" />
            {t("tutorial.tailored")}
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          {t("tutorial.step1Desc")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {stepKeys.map((step) => (
          <Card key={step.titleKey} className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {t(step.titleKey)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>{t(step.descKey)}</CardDescription>
              {step.detailsKeys && (
                <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                  {step.detailsKeys.map((key) => (
                    <li key={key}>{t(key)}</li>
                  ))}
                </ul>
              )}
              <Button asChild variant="outline" className="gap-2">
                <Link href={step.link}>
                  <PlayCircle className="h-4 w-4" />
                  {t("tutorial.goToLink", { link: step.link.replace("/", "").toUpperCase() || "HOME" })}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5 text-primary" />
            {t("tutorial.sampleProductSetup")}
          </CardTitle>
          <CardDescription>
            {t("tutorial.step3Desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {sampleProductKeys.map((product) => (
            <div key={product.nameKey} className="p-3 rounded-lg border bg-muted/40">
              <p className="font-semibold">{t(product.nameKey)}</p>
              <p className="text-sm text-muted-foreground">{t(product.unitKey)}</p>
              <p className="text-xs text-muted-foreground">{t(product.noteKey)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            {t("tutorial.step5Title")}
          </CardTitle>
          <CardDescription>
            {t("tutorial.step1Desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground">
          <p>{t("tutorial.receiptTip1")}</p>
          <p>{t("tutorial.receiptTip2")}</p>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            {t("tutorial.helpfulTips")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            • {t("tutorial.tipInventory")}<br />
            • {t("tutorial.tipReceipts")}<br />
            • {t("tutorial.tipExport")}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
