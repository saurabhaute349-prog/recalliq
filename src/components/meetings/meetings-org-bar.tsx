"use client";

import { Archive, Pin, Star } from "lucide-react";

import { MEETING_CATEGORIES, type MeetingOrgFilter } from "@/lib/meetings/organization";
import { cn } from "@/lib/utils";

const ORG_FILTERS: { id: MeetingOrgFilter; label: string; icon?: typeof Pin }[] = [
  { id: "all", label: "All" },
  { id: "pinned", label: "Pinned", icon: Pin },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "archived", label: "Archived", icon: Archive },
];

type MeetingsOrgBarProps = {
  orgFilter: MeetingOrgFilter;
  onOrgFilterChange: (filter: MeetingOrgFilter) => void;
  category: string | null;
  onCategoryChange: (category: string | null) => void;
};

export function MeetingsOrgBar({
  orgFilter,
  onOrgFilterChange,
  category,
  onCategoryChange,
}: MeetingsOrgBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {ORG_FILTERS.map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onOrgFilterChange(filter.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                orgFilter === filter.id
                  ? "border-primary/30 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {Icon ? <Icon className="size-3" /> : null}
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-[11px]",
            !category
              ? "border-primary/30 bg-primary/10"
              : "border-border text-muted-foreground",
          )}
        >
          All types
        </button>
        {MEETING_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px]",
              category === cat.id
                ? cn("border-transparent", cat.color)
                : "border-border text-muted-foreground",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
