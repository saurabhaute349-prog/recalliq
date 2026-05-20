"use client";

import { useMounted } from "@/hooks/use-mounted";
import {
  formatMeetingDate,
  formatRelativeTime,
} from "@/lib/meetings/format";

type RelativeTimeProps = {
  isoDate: string;
  className?: string;
};

/**
 * Relative labels use Date.now() — render a stable date until mounted.
 */
export function RelativeTime({ isoDate, className }: RelativeTimeProps) {
  const mounted = useMounted();

  return (
    <span className={className} suppressHydrationWarning>
      {mounted ? formatRelativeTime(isoDate) : formatMeetingDate(isoDate)}
    </span>
  );
}
