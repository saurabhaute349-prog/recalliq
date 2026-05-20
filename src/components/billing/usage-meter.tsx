import { cn } from "@/lib/utils";

type UsageMeterProps = {
  label: string;
  used: number;
  limit: number | null;
  className?: string;
};

export function UsageMeter({ label, used, limit, className }: UsageMeterProps) {
  const percent =
    limit != null && limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {used}
          {limit != null ? ` / ${limit}` : " (unlimited)"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            limit != null && used >= limit ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: limit != null ? `${percent}%` : "8%" }}
        />
      </div>
    </div>
  );
}
