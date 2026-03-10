"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import type { TranslationKey } from "@/lib/translations";
import {
  Home,
  ShoppingCart,
  Package,
  LayoutGrid,
  Percent,
  Receipt,
  BarChart3,
  ClipboardList,
  Settings,
  QrCode,
  Barcode,
  Warehouse,
  History,
  ArrowDownCircle,
  Users,
  UserCircle2,
  LogOut,
  BookOpen,
  FolderKanban,
  Wrench,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
interface NavItem {
  href: string;
  label: TranslationKey;
  icon: LucideIcon;
}

// Role requirements for navigation items – labels are translation keys
const navMain: (NavItem & { roles?: string[] })[] = [
  { href: "/dashboard", label: "nav.dashboard", icon: Home },
  { href: "/sales", label: "nav.sales", icon: ShoppingCart },
  { href: "/expenses", label: "nav.expenses", icon: ArrowDownCircle },
  {
    href: "/customers",
    label: "nav.customers",
    icon: UserCircle2,
    roles: ["admin", "manager", "cashier"],
  },
  {
    href: "/projects",
    label: "nav.projects",
    icon: FolderKanban,
    roles: ["admin", "manager", "cashier"],
  },
  {
    href: "/workers",
    label: "nav.workers",
    icon: Wrench,
    roles: ["admin", "manager", "cashier"],
  },
  {
    href: "/services",
    label: "nav.services",
    icon: Briefcase,
    roles: ["admin", "manager", "cashier"],
  },
  { href: "/products", label: "nav.products", icon: Package },
  {
    href: "/inventory",
    label: "nav.inventory",
    icon: Warehouse,
    roles: ["admin", "manager"],
  },
  { href: "/categories", label: "nav.categories", icon: LayoutGrid },
  { href: "/discounts", label: "nav.discounts", icon: Percent },
  {
    href: "/employees",
    label: "nav.users",
    icon: Users,
    roles: ["admin", "manager"],
  },
];

const navTools: NavItem[] = [
  { href: "/barcode-generator", label: "nav.barcodeGenerator", icon: QrCode },
  { href: "/receipt-designer", label: "nav.receiptDesigner", icon: Receipt },
];

const navReports: (NavItem & { roles?: string[] })[] = [
  {
    href: "/inventory/history",
    label: "nav.history",
    icon: History,
    roles: ["admin", "manager", "cashier"],
  },
  {
    href: "/receipts",
    label: "nav.recentReceipts",
    icon: Receipt,
    roles: ["admin", "manager", "cashier"],
  },
  {
    href: "/reports",
    label: "nav.reportsPage",
    icon: BarChart3,
    roles: ["admin", "manager", "cashier"],
  },
  {
    href: "/data-export",
    label: "nav.dataExport",
    icon: ClipboardList,
    roles: ["admin"],
  },
  {
    href: "/tutorial",
    label: "nav.tutorial",
    icon: BookOpen,
  },
];

function NavMain({ items }: { items: (NavItem & { roles?: string[] })[] }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { data: session } = useSession();
  const userRole = session?.user?.role as string | undefined;

  // Filter items based on user role
  const filteredItems = items.filter((item) => {
    if (!item.roles) return true; // No role requirement
    if (!userRole) return false; // User not logged in
    return item.roles.includes(userRole);
  });

  return (
    <SidebarMenu>
      {filteredItems.map((item) => {
        const Icon = item.icon;
        // Check if pathname matches or starts with the href (for sub-routes)
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={t(item.label)}>
              <Link href={item.href}>
                <Icon />
                <span>{t(item.label)}</span>
                  {( item.href == "/customers" || item.href == "/discounts" ) && (
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                      {t("nav.badgeNew")}
                    </Badge>
                  )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function NavTools({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={t(item.label)}>
              <Link href={item.href}>
                <Icon />
                <span>{t(item.label)}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function NavReports({ items }: { items: (NavItem & { roles?: string[] })[] }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { data: session } = useSession();
  const userRole = session?.user?.role as string | undefined;

  // Filter items based on user role
  const filteredItems = items.filter((item) => {
    if (!item.roles) return true; // No role requirement
    if (!userRole) return false; // User not logged in
    return item.roles.includes(userRole);
  });

  if (filteredItems.length === 0) return null;

  return (
    <SidebarMenu>
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={t(item.label)}>
              <Link href={item.href}>
                <Icon />
                <span className="flex items-center gap-2">
                  {t(item.label)}
                  {item.href === "/reports" && (
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                      {t("nav.badgeNew")}
                    </Badge>
                  )}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { state } = useSidebar();
  const { data: session } = useSession();
  const isSettingsActive = pathname === "/settings";
  const userRole = session?.user?.role as string | undefined;
  const userName = session?.user?.name || t("common.user");
  const userEmail = session?.user?.email || "";

  // Check if user can access settings (admin or manager)
  const canAccessSettings = userRole === "admin" || userRole === "manager";

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Package className="size-4" />
                </div>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">{t("app.name")}</span>
                  <span className="truncate text-xs">{t("app.tagline")}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.main")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={navMain} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.tools")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavTools items={navTools} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.reports")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavReports items={navReports} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {canAccessSettings && (
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                isActive={isSettingsActive}
                tooltip={t("nav.settings")}
              >
                <Link href="/settings">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Settings className="size-4" />
                  </div>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {state === "collapsed" ? t("nav.settings") : t("nav.systemSettings")}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0 mb-5">
                    <div className="font-semibold truncate w-full">
                      {userName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate w-full">
                      {userEmail}
                    </div>
                    {userRole && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {userRole}
                      </Badge>
                    )}
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t("nav.myAccount")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="me-2 h-4 w-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail aria-label={t("common.toggleSidebar")} title={t("common.toggleSidebar")} />
    </Sidebar>
  );
}
