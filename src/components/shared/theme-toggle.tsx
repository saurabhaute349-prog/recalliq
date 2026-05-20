"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useMounted } from "@/hooks/use-mounted";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50",
        "flex items-center justify-center",
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={
          !mounted
            ? "Toggle theme"
            : isDark
              ? "Switch to light mode"
              : "Switch to dark mode"
        }
        disabled={!mounted}
        className={cn(
          "border-border bg-background text-muted-foreground shadow-sm",
          "hover:bg-muted hover:text-foreground",
        )}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        suppressHydrationWarning
      >
        <span className="inline-flex size-4 items-center justify-center">
          {!mounted ? null : isDark ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </span>
      </Button>
    </div>
  );
}
