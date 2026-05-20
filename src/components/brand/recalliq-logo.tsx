import { RecalliqMark } from "@/components/brand/recalliq-mark";
import { RecalliqWordmark } from "@/components/brand/recalliq-wordmark";
import { cn } from "@/lib/utils";

export type RecalliqLogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
};

const markSizes = {
  sm: 28,
  md: 32,
  lg: 40,
} as const;

export function RecalliqLogo({
  className,
  showWordmark = true,
  size = "md",
  animated = false,
}: RecalliqLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span className={cn(animated && "animate-pulse")}>
        <RecalliqMark size={markSizes[size]} />
      </span>
      {showWordmark ? <RecalliqWordmark /> : null}
    </span>
  );
}
