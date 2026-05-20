import type { PlanType, Profile } from "@/types/database";

export type RawProfileRow = Record<string, unknown>;

/** SQL: coalesce(plan_type, plan, 'free') */
export function resolvePlanType(row: RawProfileRow | null | undefined): PlanType {
  if (!row) return "free";

  const raw = row.plan_type ?? row.plan ?? "free";
  return raw === "pro" ? "pro" : "free";
}

export function normalizeProfileRow(row: RawProfileRow | null): Profile | null {
  if (!row || row.id == null) return null;

  return {
    id: String(row.id),
    full_name: (row.full_name as string | null) ?? null,
    meetings_used: Number(row.meetings_used ?? 0),
    plan_type: resolvePlanType(row),
    razorpay_customer_id: (row.razorpay_customer_id as string | null) ?? null,
    razorpay_subscription_id: (row.razorpay_subscription_id as string | null) ??
      null,
    subscription_status:
      (row.subscription_status as Profile["subscription_status"]) ?? null,
    current_period_end: (row.current_period_end as string | null) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}
