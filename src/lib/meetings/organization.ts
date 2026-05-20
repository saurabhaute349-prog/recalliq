export const MEETING_CATEGORIES = [
  { id: "sales", label: "Sales", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  { id: "standup", label: "Standup", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  { id: "interview", label: "Interview", color: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
  { id: "product", label: "Product", color: "bg-primary/15 text-primary" },
  { id: "support", label: "Support", color: "bg-amber-500/15 text-amber-800 dark:text-amber-200" },
  { id: "customer_call", label: "Customer call", color: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-200" },
  { id: "general", label: "General", color: "bg-muted text-muted-foreground" },
] as const;

export type MeetingCategoryId = (typeof MEETING_CATEGORIES)[number]["id"];

export type MeetingOrgFilter =
  | "all"
  | "pinned"
  | "favorites"
  | "archived";

export function getCategoryStyle(category: string | null | undefined): string {
  const match = MEETING_CATEGORIES.find((c) => c.id === category);
  return match?.color ?? MEETING_CATEGORIES.find((c) => c.id === "general")!.color;
}

export function getCategoryLabel(category: string | null | undefined): string {
  const match = MEETING_CATEGORIES.find((c) => c.id === category);
  return match?.label ?? "General";
}
