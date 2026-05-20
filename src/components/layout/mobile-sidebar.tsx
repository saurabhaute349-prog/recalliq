"use client";

import Link from "next/link";

import { RecalliqLogo } from "@/components/brand";
import { LogoutButton } from "@/components/auth/logout-button";
import { SidebarNav } from "@/components/layout/sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type MobileSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCommand?: () => void;
};

export function MobileSidebar({
  open,
  onOpenChange,
  onOpenCommand,
}: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className={cn(
          "flex h-full w-[min(100vw-2rem,280px)] flex-col gap-0 border-sidebar-border bg-sidebar p-0",
          "text-sidebar-foreground",
        )}
      >
        <SheetHeader className="border-b border-sidebar-border px-4 py-5 text-left">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Link
            href="/dashboard"
            onClick={() => onOpenChange(false)}
            className="flex items-center"
          >
            <RecalliqLogo size="sm" />
          </Link>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-3 py-6">
            <SidebarNav onNavigate={() => onOpenChange(false)} />
          </div>
          <div className="border-t border-sidebar-border px-3 py-4">
            <LogoutButton />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
