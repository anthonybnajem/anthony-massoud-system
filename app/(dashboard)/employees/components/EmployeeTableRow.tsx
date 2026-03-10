"use client";

import { useLanguage } from "@/components/language-provider";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, User } from "lucide-react";
import { type Employee } from "@/components/pos-data-provider";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface EmployeeTableRowProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  variants?: any;
}

export function EmployeeTableRow({
  employee,
  onEdit,
  onDelete,
  variants,
}: EmployeeTableRowProps) {
  const { t } = useLanguage();
  const getRoleBadge = (role: Employee["role"]) => {
    const roleLabels: Record<Employee["role"], string> = {
      admin: t("employees.roleAdmin"),
      manager: t("employees.roleManager"),
      cashier: t("employees.roleCashier"),
      staff: t("employees.roleStaff"),
    };
    const badgeVariants: Record<Employee["role"], "default" | "secondary" | "destructive" | "outline"> = {
      admin: "destructive",
      manager: "default",
      cashier: "secondary",
      staff: "outline",
    };
    return <Badge variant={badgeVariants[role]}>{roleLabels[role]}</Badge>;
  };

  return (
    <motion.tr
      variants={variants}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, height: 0 }}
      className="hover:bg-muted/50 transition-colors"
    >
      <TableCell className="font-medium text-start">
        <div className="flex items-center gap-3 justify-start text-start">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold">{employee.name}</div>
            <div className="text-xs text-muted-foreground">
              {employee.email}
            </div>
            {employee.phone && (
              <div className="text-xs text-muted-foreground">
                {employee.phone}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>{getRoleBadge(employee.role)}</TableCell>
      <TableCell>
        <Badge variant={employee.isActive ? "default" : "secondary"}>
          {employee.isActive ? t("employees.active") : t("employees.inactiveLabel")}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground text-start">
        {format(new Date(employee.hireDate), "MMM dd, yyyy")}
      </TableCell>
      <TableCell className="text-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(employee)}>
              <Edit className="me-2 h-4 w-4" />
              {t("common.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(employee)}
              className="text-destructive"
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
