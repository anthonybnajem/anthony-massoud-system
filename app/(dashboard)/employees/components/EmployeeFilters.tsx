"use client";

import { useLanguage } from "@/components/language-provider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface EmployeeFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterRole: string;
  onFilterRoleChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

export function EmployeeFilters({
  searchQuery,
  onSearchChange,
  filterRole,
  onFilterRoleChange,
  filterStatus,
  onFilterStatusChange,
  sortBy,
  onSortByChange,
}: EmployeeFiltersProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={t("employees.searchEmployeesPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="ps-9 h-11 border-2 focus:border-primary transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterRole} onValueChange={onFilterRoleChange}>
          <SelectTrigger className="w-[180px] border-2">
            <SelectValue placeholder={t("employees.rolePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("employees.allRoles")}</SelectItem>
            <SelectItem value="admin">{t("employees.roleAdmin")}</SelectItem>
            <SelectItem value="manager">{t("employees.roleManager")}</SelectItem>
            <SelectItem value="cashier">{t("employees.roleCashier")}</SelectItem>
            <SelectItem value="staff">{t("employees.roleStaff")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="w-[180px] border-2">
            <SelectValue placeholder={t("employees.statusPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("employees.allStatus")}</SelectItem>
            <SelectItem value="active">{t("employees.active")}</SelectItem>
            <SelectItem value="inactive">{t("employees.inactiveLabel")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-[180px] border-2">
            <SelectValue placeholder={t("employees.sortByPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{t("employees.sortName")}</SelectItem>
            <SelectItem value="role">{t("employees.sortRole")}</SelectItem>
            <SelectItem value="hireDate">{t("employees.sortHireDate")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
