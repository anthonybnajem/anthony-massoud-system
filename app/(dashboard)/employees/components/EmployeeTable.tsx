"use client";

import { useLanguage } from "@/components/language-provider";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Users } from "lucide-react";
import { EmployeeTableRow } from "./EmployeeTableRow";
import { type Employee } from "@/components/pos-data-provider";
import { AnimatePresence } from "framer-motion";

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  itemVariants?: any;
}

export function EmployeeTable({
  employees,
  onEdit,
  onDelete,
  itemVariants,
}: EmployeeTableProps) {
  const { t } = useLanguage();
  if (employees.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>{t("employees.noEmployeesFound")}</EmptyTitle>
          <EmptyDescription>
            {t("employees.noEmployeesMatchFilters")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px] text-start">{t("employees.employeeHeader")}</TableHead>
            <TableHead className="text-start">{t("employees.roleHeader")}</TableHead>
            <TableHead className="text-start">{t("employees.statusHeader")}</TableHead>
            <TableHead className="text-start">{t("employees.hireDateHeader")}</TableHead>
            <TableHead className="w-[70px] text-end">{t("employees.actionsHeader")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {employees.map((employee) => (
              <EmployeeTableRow
                key={employee.id}
                employee={employee}
                onEdit={onEdit}
                onDelete={onDelete}
                variants={itemVariants}
              />
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
