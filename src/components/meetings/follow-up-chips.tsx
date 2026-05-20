"use client";

import { memo } from "react";

import { cn } from "@/lib/utils";

type FollowUpChipsProps = {
  suggestions: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
  className?: string;
};

export const FollowUpChips = memo(function FollowUpChips({
  suggestions,
  onSelect,
  disabled,
  className,
}: FollowUpChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div
      className={cn("flex flex-wrap gap-2 pt-3", className)}
      role="group"
      aria-label="Suggested follow-up questions"
    >
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
          className="min-h-9 max-w-full rounded-full border border-border bg-muted/30 px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted/50 hover:text-foreground disabled:opacity-50 sm:text-center"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
});
