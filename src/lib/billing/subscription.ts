import { createHmac, timingSafeEqual } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { updateProfileByUserId } from "@/lib/supabase/profile-repository";
import type { getRazorpay } from "@/lib/payments/razorpay";
import type { Profile, SubscriptionStatus } from "@/types/database";

type RazorpaySubscription = {
  id: string;
  status: string;
  current_end?: number;
  customer_id?: string;
  ended_at?: number | null;
  notes?: { user_id?: string };
};

export function verifySubscriptionPaymentSignature(input: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
  secret: string;
}): boolean {
  const expected = createHmac("sha256", input.secret)
    .update(`${input.paymentId}|${input.subscriptionId}`)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(input.signature),
    );
  } catch {
    return false;
  }
}

export function mapRazorpayStatus(status: string): SubscriptionStatus {
  const allowed: SubscriptionStatus[] = [
    "created",
    "authenticated",
    "active",
    "pending",
    "halted",
    "cancelled",
    "completed",
    "expired",
  ];

  if (allowed.includes(status as SubscriptionStatus)) {
    return status as SubscriptionStatus;
  }

  return "pending";
}

export function periodEndFromSubscription(
  subscription: RazorpaySubscription,
): string | null {
  if (!subscription.current_end) {
    return null;
  }

  return new Date(subscription.current_end * 1000).toISOString();
}

export async function syncProfileFromSubscription(
  userId: string,
  subscription: RazorpaySubscription,
): Promise<Profile | null> {
  const admin = createAdminClient();
  const status = mapRazorpayStatus(subscription.status);
  const periodEnd = periodEndFromSubscription(subscription);
  const periodStillValid =
    periodEnd !== null && new Date(periodEnd).getTime() > Date.now();
  const isActiveStatus =
    status === "active" || status === "authenticated";
  const keepPro = isActiveStatus || periodStillValid;

  return updateProfileByUserId(
    admin,
    userId,
    {
      plan_type: keepPro ? "pro" : "free",
      razorpay_subscription_id: subscription.id,
      razorpay_customer_id: subscription.customer_id ?? null,
      subscription_status: status,
      current_period_end: periodEnd,
    },
    "syncProfileFromSubscription",
  );
}

export async function fetchRazorpaySubscription(
  razorpay: ReturnType<typeof getRazorpay>,
  subscriptionId: string,
): Promise<RazorpaySubscription> {
  const subscription = await razorpay.subscriptions.fetch(subscriptionId);
  return subscription as RazorpaySubscription;
}
