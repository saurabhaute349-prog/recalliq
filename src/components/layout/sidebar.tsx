"use client";

import {
  CreditCard,
  LayoutDashboard,
  Search,
  Settings,
  Video,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { RecalliqLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type DashboardNavSection = {
  label: string;
  items: DashboardNavItem[];
};

export const dashboardNavigation: DashboardNavSection[] = [
  {
    label: "Workspace",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Meetings", href: "/meetings", icon: Video },
      { title: "Search", href: "/search", icon: Search },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Billing", href: "/billing", icon: CreditCard },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function isNavItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-8", className)} aria-label="Main">
      {dashboardNavigation.map((section) => (
        <div key={section.label} className="flex flex-col gap-1.5">
          <p className="px-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {section.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-sidebar-foreground",
                      )}
                      strokeWidth={isActive ? 2.25 : 2}
                    />
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarLogo() {
  return (
    <Link
      href="/dashboard"
      className="rounded-lg px-1 py-1 transition-opacity hover:opacity-90"
    >
      <RecalliqLogo size="sm" />
    </Link>
  );
}

type SidebarProps = {
  className?: string;
  onOpenCommand?: () => void;
};

export function Sidebar({ className, onOpenCommand }: SidebarProps) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex",
        className,
      )}
    >
      <div className="flex h-full flex-col px-4 py-6">
        <SidebarLogo />
        <div className="mt-10 flex-1 overflow-y-auto">
          <SidebarNav />
          {onOpenCommand ? (
            <button
              type="button"
              onClick={onOpenCommand}
              className="mt-6 flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground"
            >
              <span className="rounded border bg-muted px-1 font-mono text-[10px]">⌘K</span>
              Quick search
            </button>
          ) : null}
        </div>
        <div className="mt-4 border-t border-sidebar-border pt-4">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
