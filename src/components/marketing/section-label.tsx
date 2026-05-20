import { cn } from "@/lib/utils";

type SectionLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        "text-xs font-medium tracking-wide text-primary uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}
