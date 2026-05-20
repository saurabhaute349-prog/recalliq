import "server-only";

import { recordBillingEvent } from "@/lib/billing/events";
import { subscriptionBelongsToUser } from "@/lib/billing/subscription-ownership";
import {
  fetchRazorpaySubscription,
  syncProfileFromSubscription,
} from "@/lib/billing/subscription";
import { getRazorpay } from "@/lib/payments/razorpay";
import type { Profile } from "@/types/database";

export async function cancelSubscriptionAtPeriodEnd(
  userId: string,
  subscriptionId: string,
): Promise<Profile | null> {
  const razorpay = getRazorpay();

  const subscription = await fetchRazorpaySubscription(razorpay, subscriptionId);

  if (!subscriptionBelongsToUser(subscription, userId, subscriptionId)) {
    throw new Error("Subscription does not belong to this account.");
  }

  await razorpay.subscriptions.cancel(subscriptionId, true);

  const updatedSubscription = await fetchRazorpaySubscription(
    razorpay,
    subscriptionId,
  );
  const profile = await syncProfileFromSubscription(
    userId,
    updatedSubscription,
  );

  await recordBillingEvent({
    userId,
    type: "subscription_cancelled",
    status: "cancelled",
    razorpaySubscriptionId: subscriptionId,
    metadata: { cancel_at_cycle_end: true },
  });

  return profile;
}
