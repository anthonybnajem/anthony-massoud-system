"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowRight, ArrowUpRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  meta?: string;
  badge?: {
    label: string;
    tone?: "positive" | "negative" | "neutral";
  };
  icon: LucideIcon;
  variants?: any;
  href?: string;
}

export function StatsCard({
  title,
  value,
  description,
  meta,
  badge,
  icon: Icon,
  variants,
  href,
}: StatsCardProps) {
  const badgeTone = badge?.tone || "neutral";
  const badgeClasses =
    badgeTone === "positive"
      ? "bg-[rgba(126,217,87,0.2)] text-[#4b8f2e]"
      : badgeTone === "negative"
        ? "bg-[rgba(248,113,113,0.2)] text-[#b93f3f]"
        : "bg-white/40 text-slate-600";

  const BadgeIcon =
    badgeTone === "positive"
      ? ArrowUpRight
      : badgeTone === "negative"
        ? ArrowDownRight
        : ArrowRight;

  const cardContent = (
    <Card
      className={
        href
          ? "transition-all duration-200 ease-in-out hover:border-white/70 hover:shadow-[0_12px_32px_rgba(15,23,42,0.12)] focus-visible:border-white focus-visible:ring-2 focus-visible:ring-white/60"
          : undefined
      }
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <div className="mt-4 text-[42px] font-bold tracking-tight text-slate-800 md:text-[52px]">
              {value}
            </div>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
            {badge && (
              <div
                className={cn(
                  "mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                  badgeClasses
                )}
              >
                <BadgeIcon className="h-3.5 w-3.5" />
                {badge.label}
              </div>
            )}
            {meta && <p className="mt-4 text-xs text-slate-500">{meta}</p>}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/50 shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
            <Icon className="h-5 w-5 text-slate-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <motion.div variants={variants}>
      {href ? (
        <Link href={href} className="block focus:outline-none">
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </motion.div>
  );
}
