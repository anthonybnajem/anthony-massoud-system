"use client";

import  React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

type TabConfig<T> = {
  value: string;
  label: string;
  items: T[];
  emptyState?: React.ReactNode;
  gridClassName?: string;
};

interface ProductTabsProps<T> {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: TabConfig<T>[];
  renderItem: (item: T) => React.ReactNode;
  getKey?: (item: T, index: number) => string | number;
  containerVariants?: any;
  isTablet?: boolean;
  showTabs?: boolean;
  className?: string;
  contentClassName?: string;
}

export function ProductTabs<T>({
  activeTab,
  onTabChange,
  tabs,
  renderItem,
  getKey,
  containerVariants,
  isTablet = false,
  showTabs = true,
  className,
  contentClassName,
}: ProductTabsProps<T>) {
  const hasMultipleTabs = tabs.length > 1;
  const shouldShowTabs = showTabs && hasMultipleTabs;
  const wrapperClassName =
    className ?? "card flex-1 overflow-hidden flex flex-col min-h-0";
  const contentPaddingClass =
    contentClassName ??
    `flex-1 overflow-auto ${isTablet ? "p-3" : "p-2 sm:p-3"} min-h-0`;
  const tabsListClassName = `grid w-full h-11 bg-muted/50 ${
    tabs.length >= 4
      ? "grid-cols-4"
      : tabs.length === 3
      ? "grid-cols-3"
      : tabs.length === 2
      ? "grid-cols-2"
      : "grid-cols-1"
  }`;

  return (
    <Tabs
      defaultValue={tabs[0]?.value || "all"}
      value={activeTab}
      onValueChange={onTabChange}
      className={wrapperClassName}
    >
      {shouldShowTabs && (
        <div className="px-4 pt-4 flex-shrink-0">
          <TabsList className={tabsListClassName}>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      )}

      {tabs.map((tab) => {
        const gridClassName =
          tab.gridClassName ??
          `grid ${
            isTablet
              ? "grid-cols-2 gap-3"
              : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4  gap-2 sm:gap-3 md:gap-4"
          } w-full min-w-0`;

        return (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="flex-1 overflow-hidden mt-0 data-[state=active]:flex data-[state=active]:flex-col data-[state=inactive]:hidden"
          >
            <div className={contentPaddingClass}>
              {tab.items.length > 0 ? (
                containerVariants ? (
                  <motion.div
                    className={gridClassName}
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {tab.items.map((item, index) => (
                      <React.Fragment
                        key={getKey ? getKey(item, index) : index}
                      >
                        {renderItem(item)}
                      </React.Fragment>
                    ))}
                  </motion.div>
                ) : (
                  <div className={gridClassName}>
                    {tab.items.map((item, index) => (
                      <React.Fragment
                        key={getKey ? getKey(item, index) : index}
                      >
                        {renderItem(item)}
                      </React.Fragment>
                    ))}
                  </div>
                )
              ) : (
                tab.emptyState ?? (
                  <div className="text-sm text-slate-500">No items found.</div>
                )
              )}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
