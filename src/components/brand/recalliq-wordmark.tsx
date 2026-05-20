import { BRAND } from "@/lib/brand/config";
import { cn } from "@/lib/utils";

type RecalliqWordmarkProps = {
  className?: string;
  showTagline?: boolean;
};

export function RecalliqWordmark({
  className,
  showTagline = true,
}: RecalliqWordmarkProps) {
  return (
    <span className={cn("flex flex-col gap-0.5 leading-none", className)}>
      <span className="text-sm font-semibold tracking-tight">{BRAND.name}</span>
      {showTagline ? (
        <span className="text-[11px] text-muted-foreground">{BRAND.tagline}</span>
      ) : null}
    </span>
  );
}
