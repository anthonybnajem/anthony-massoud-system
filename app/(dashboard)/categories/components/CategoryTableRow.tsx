"use client";

import { useLanguage } from "@/components/language-provider";
import { motion } from "framer-motion";
import { type Category } from "@/components/pos-data-provider";
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tags, MoreVertical, Edit, Trash2 } from "lucide-react";

interface CategoryTableRowProps {
  category: Category;
  productCount: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  variants?: any;
}

export function CategoryTableRow({
  category,
  productCount,
  onEdit,
  onDelete,
  variants,
}: CategoryTableRowProps) {
  const { t } = useLanguage();
  return (
    <motion.tr
      variants={variants}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, height: 0 }}
    >
      <TableCell className="text-start">
        <div className="flex items-center gap-3 justify-start text-start">
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
            <Tags className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="font-medium">{category.name}</p>
        </div>
      </TableCell>
      <TableCell className="text-start">{category.description || "-"}</TableCell>
      <TableCell className="text-start">{productCount}</TableCell>
      <TableCell className="text-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Edit className="me-2 h-4 w-4" />
              {t("common.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(category)}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  );
}
