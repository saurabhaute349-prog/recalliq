"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { RecalliqLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { trackClientEvent } from "@/lib/analytics/client";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
] as const;

export function MarketingHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="transition-opacity hover:opacity-90">
          <RecalliqLogo size="sm" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-foreground",
                pathname === item.href && "font-medium text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link
              href="/signup"
              onClick={() =>
                trackClientEvent(AnalyticsEvents.marketingCta, {
                  placement: "header",
                })
              }
            >
              Get Started Free
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
