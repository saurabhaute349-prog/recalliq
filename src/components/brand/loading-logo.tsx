import { BRAND } from "@/lib/brand/config";
import { RecalliqMark } from "@/components/brand/recalliq-mark";
import { cn } from "@/lib/utils";

type LoadingLogoProps = {
  className?: string;
  label?: string;
};

export function LoadingLogo({
  className,
  label = `Loading ${BRAND.name}`,
}: LoadingLogoProps) {
  return (
    <div
      className={cn("flex flex-col items-center gap-3", className)}
      role="status"
      aria-label={label}
    >
      <RecalliqMark size={40} className="animate-pulse" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
