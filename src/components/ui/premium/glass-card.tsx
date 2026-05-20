import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
type GlassCardProps = { children: ReactNode; className?: string };
export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div className={cn("rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm", className)}>
      {children}
    </div>
  );
}
