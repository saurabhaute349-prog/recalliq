import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { PRO_PLAN_CURRENCY } from "@/lib/payments/constants";
import type { BillingEventStatus, BillingEventType } from "@/types/database";

export type RecordBillingEventInput = {
  userId: string;
  type: BillingEventType;
  status: BillingEventStatus;
  amount?: number | null;
  currency?: string;
  razorpayEventId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySubscriptionId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function isBillingEventProcessed(
  razorpayEventId: string,
): Promise<boolean> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("billing_events")
    .select("id")
    .eq("razorpay_event_id", razorpayEventId)
    .maybeSingle();

  if (error) {
    console.error("[billing/events] duplicate check failed", error.message);
    return false;
  }

  return Boolean(data);
}

export async function recordBillingEvent(
  input: RecordBillingEventInput,
): Promise<{ recorded: boolean; duplicate: boolean }> {
  const admin = createAdminClient();

  if (input.razorpayEventId) {
    const duplicate = await isBillingEventProcessed(input.razorpayEventId);
    if (duplicate) {
      return { recorded: false, duplicate: true };
    }
  }

  const { error } = await admin.from("billing_events").insert({
    user_id: input.userId,
    type: input.type,
    status: input.status,
    amount: input.amount ?? null,
    currency: input.currency ?? PRO_PLAN_CURRENCY,
    razorpay_event_id: input.razorpayEventId ?? null,
    razorpay_payment_id: input.razorpayPaymentId ?? null,
    razorpay_subscription_id: input.razorpaySubscriptionId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    if (error.code === "23505") {
      return { recorded: false, duplicate: true };
    }

    throw error;
  }

  return { recorded: true, duplicate: false };
}
