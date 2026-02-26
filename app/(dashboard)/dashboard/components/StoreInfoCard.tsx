"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Store {
  name: string;
  address: string;
}

interface StoreInfoCardProps {
  activeStore: Store | null;
  canUseEnterpriseFeatures: boolean;
}

export function StoreInfoCard({
  activeStore,
  canUseEnterpriseFeatures,
}: StoreInfoCardProps) {
  if (!activeStore) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                {activeStore.name}
              </h3>
              <p className="text-sm text-slate-500">{activeStore.address}</p>
            </div>
            {canUseEnterpriseFeatures && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings/stores">Manage Stores</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
