"use client";

import { Command, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavbarProps = {
  title: string;
  onMenuClick?: () => void;
  onOpenCommand?: () => void;
  className?: string;
};

export function Navbar({
  title,
  onMenuClick,
  onOpenCommand,
  className,
}: NavbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4 md:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="size-4" />
        </Button>

        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2" aria-label="Toolbar">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="hidden h-8 gap-2 text-muted-foreground sm:inline-flex"
          onClick={onOpenCommand}
        >
          <Command className="size-3.5" />
          <span className="text-xs">Search</span>
          <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">
            ⌘K
          </kbd>
        </Button>
      </div>
    </header>
  );
}
