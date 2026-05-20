import type { Profile, SubscriptionStatus } from "@/types/database";

const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "active",
  "authenticated",
];

export function hasProAccess(
  profile: Pick<
    Profile,
    "plan_type" | "subscription_status" | "current_period_end"
  > | null,
): boolean {
  if (!profile || profile.plan_type !== "pro") {
    return false;
  }

  if (profile.current_period_end) {
    return new Date(profile.current_period_end).getTime() > Date.now();
  }

  if (profile.subscription_status) {
    return ACTIVE_SUBSCRIPTION_STATUSES.includes(profile.subscription_status);
  }

  return false;
}

export function isSubscriptionEnding(
  profile: Pick<
    Profile,
    "plan_type" | "subscription_status" | "current_period_end"
  > | null,
): boolean {
  if (!profile?.subscription_status) return false;
  return (
    profile.subscription_status === "cancelled" ||
    profile.subscription_status === "completed"
  );
}

export function getPlanDisplayName(
  profile: Pick<
    Profile,
    "plan_type" | "subscription_status" | "current_period_end"
  > | null,
): "Free" | "Pro" {
  return hasProAccess(profile) ? "Pro" : "Free";
}

export type BillingStatusCategory =
  | "active"
  | "cancelled"
  | "past_due"
  | "inactive";

export function getBillingStatusCategory(
  status: string | null,
): BillingStatusCategory {
  if (!status) return "inactive";
  if (status === "active" || status === "authenticated") return "active";
  if (status === "cancelled" || status === "completed") return "cancelled";
  if (status === "halted" || status === "pending" || status === "expired") {
    return "past_due";
  }
  return "inactive";
}

export function formatBillingStatusCategory(
  category: BillingStatusCategory,
): string {
  const labels: Record<BillingStatusCategory, string> = {
    active: "Active",
    cancelled: "Cancelled",
    past_due: "Past due",
    inactive: "Not subscribed",
  };
  return labels[category];
}

export function needsPaymentRetry(
  profile: Pick<Profile, "subscription_status" | "plan_type"> | null,
  isPro: boolean,
): boolean {
  if (!profile) return false;
  const category = getBillingStatusCategory(profile.subscription_status);
  if (category === "past_due") return true;
  return profile.plan_type === "pro" && !isPro;
}

export function formatSubscriptionStatus(status: string | null): string {
  if (!status) return "Not subscribed";

  const labels: Record<string, string> = {
    created: "Created",
    authenticated: "Active",
    active: "Active",
    pending: "Past due",
    halted: "Past due",
    cancelled: "Cancelled",
    completed: "Completed",
    expired: "Past due",
  };

  return labels[status] ?? status;
}
