/**
 * Legacy column constants. Prefer `profile-repository` helpers which apply
 * coalesce(plan_type, plan, 'free') when reading profiles.
 */
export const PROFILE_COLUMNS =
  "id, full_name, meetings_used, plan_type, razorpay_customer_id, razorpay_subscription_id, subscription_status, current_period_end, created_at, updated_at" as const;

export const PROFILE_PLAN_COLUMNS =
  "plan_type, subscription_status, current_period_end" as const;
