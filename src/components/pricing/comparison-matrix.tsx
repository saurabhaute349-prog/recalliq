import { Check, X } from "lucide-react";

import { COMPARISON_ROWS } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto size-4 text-primary" aria-label="Included" />
    ) : (
      <X className="mx-auto size-4 text-muted-foreground/50" aria-label="Not included" />
    );
  }
  return <span className="text-sm text-foreground">{value}</span>;
}

export function ComparisonMatrix() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 font-medium text-muted-foreground">Feature</th>
            <th className="px-4 py-3 font-medium">Free</th>
            <th className="px-4 py-3 font-medium text-primary">Pro</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row) => (
            <tr key={row.feature} className="border-b border-border/80 last:border-0">
              <td className="px-4 py-3 text-muted-foreground">{row.feature}</td>
              <td className={cn("px-4 py-3 text-center")}>
                <CellValue value={row.free} />
              </td>
              <td className="px-4 py-3 text-center">
                <CellValue value={row.pro} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
