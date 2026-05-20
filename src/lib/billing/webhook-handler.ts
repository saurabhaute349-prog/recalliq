import "server-only";

import { revalidatePath } from "next/cache";

import { recordBillingEvent } from "@/lib/billing/events";
import { hasProAccess } from "@/lib/billing/plan";
import {
  fetchRazorpaySubscription,
  syncProfileFromSubscription,
} from "@/lib/billing/subscription";
import { getUserEmailAndName } from "@/lib/billing/user-email";
import {
  sendPaymentFailedEmail,
  sendRenewalSuccessEmail,
  sendSubscriptionCancelledEmail,
  sendUpgradeSuccessEmail,
} from "@/lib/email/send";
import { getRazorpay } from "@/lib/payments/razorpay";
import {
  PRO_PLAN_CURRENCY,
  PRO_PLAN_LABEL,
} from "@/lib/payments/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BillingEventType } from "@/types/database";

type RazorpayEntity = {
  id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  notes?: { user_id?: string };
  subscription_id?: string;
};

export type RazorpayWebhookPayload = {
  event: string;
  payload?: {
    subscription?: { entity?: RazorpayEntity };
    payment?: { entity?: RazorpayEntity };
  };
};

function eventTypeFromName(eventName: string): BillingEventType {
  const map: Record<string, BillingEventType> = {
    "subscription.activated": "subscription_activated",
    "subscription.charged": "renewal_success",
    "subscription.cancelled": "subscription_cancelled",
    "subscription.completed": "subscription_cancelled",
    "subscription.halted": "payment_failed",
    "payment.captured": "payment_captured",
    "payment.failed": "payment_failed",
  };

  return map[eventName] ?? "payment_captured";
}

async function resolveUserId(
  subscriptionId: string | null,
  notesUserId?: string,
): Promise<string | null> {
  if (!subscriptionId) {
    return notesUserId ?? null;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("razorpay_subscription_id", subscriptionId)
    .maybeSingle();

  const fromDb = data?.id ?? null;

  if (fromDb) {
    if (notesUserId && notesUserId !== fromDb) {
      console.warn(
        "[billing/webhook] notes.user_id mismatch; using profile subscription owner",
        { subscriptionId, notesUserId, fromDb },
      );
    }
    return fromDb;
  }

  return notesUserId ?? null;
}

export async function handleRazorpayWebhook(input: {
  event: RazorpayWebhookPayload;
  razorpayEventId: string | null;
}): Promise<{ handled: boolean; duplicate?: boolean }> {
  const { event, razorpayEventId } = input;
  const eventName = event.event;

  const subscriptionEntity = event.payload?.subscription?.entity;
  const paymentEntity = event.payload?.payment?.entity;

  const subscriptionId =
    subscriptionEntity?.id ?? paymentEntity?.subscription_id ?? null;

  const userId = await resolveUserId(
    subscriptionId,
    subscriptionEntity?.notes?.user_id ?? paymentEntity?.notes?.user_id,
  );

  if (!userId) {
    console.warn("[billing/webhook] no user for event", eventName);
    return { handled: true };
  }

  if (razorpayEventId) {
    const { duplicate } = await recordBillingEvent({
      userId,
      type: eventTypeFromName(eventName),
      status: paymentEntity?.status ?? subscriptionEntity?.status ?? "received",
      amount: paymentEntity?.amount ?? null,
      currency: paymentEntity?.currency ?? PRO_PLAN_CURRENCY,
      razorpayEventId,
      razorpayPaymentId: paymentEntity?.id ?? null,
      razorpaySubscriptionId: subscriptionId,
      metadata: { event: eventName },
    });

    if (duplicate) {
      return { handled: true, duplicate: true };
    }
  }

  let profile = null;

  if (subscriptionId) {
    const razorpay = getRazorpay();
    const subscription = await fetchRazorpaySubscription(
      razorpay,
      subscriptionId,
    );
    profile = await syncProfileFromSubscription(userId, subscription);
  }

  const { email, name } = await getUserEmailAndName(userId);

  if (email) {
    if (
      (eventName === "subscription.activated" ||
        eventName === "payment.captured") &&
      profile &&
      hasProAccess(profile)
    ) {
      await sendUpgradeSuccessEmail({
        to: email,
        name,
        planName: PRO_PLAN_LABEL,
        currentPeriodEnd: profile.current_period_end,
      });
    }

    if (eventName === "subscription.charged" && profile && hasProAccess(profile)) {
      await sendRenewalSuccessEmail({
        to: email,
        name,
        currentPeriodEnd: profile.current_period_end,
      });
    }

    if (
      eventName === "subscription.cancelled" ||
      eventName === "subscription.completed"
    ) {
      await sendSubscriptionCancelledEmail({
        to: email,
        name,
        accessUntil: profile?.current_period_end ?? null,
      });
    }

    if (eventName === "payment.failed" || eventName === "subscription.halted") {
      await sendPaymentFailedEmail({ to: email, name });
    }
  }

  revalidatePath("/billing");
  revalidatePath("/dashboard");
  revalidatePath("/meetings");
  revalidatePath("/new");

  return { handled: true };
}
