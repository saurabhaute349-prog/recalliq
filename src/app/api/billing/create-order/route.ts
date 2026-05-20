import { NextResponse } from "next/server";

import { BRAND } from "@/lib/brand/config";
import { recordBillingEvent } from "@/lib/billing/events";
import { logBillingDev } from "@/lib/billing/dev-log";
import { hasProAccess } from "@/lib/billing/plan";
import { getUserProfileForBilling } from "@/lib/billing/queries";
import { resolveRazorpayCustomerId } from "@/lib/payments/razorpay-customer";
import {
  assertRazorpayServerConfig,
  getPublicRazorpayKeyId,
  getRazorpay,
  getRazorpayPlanId,
} from "@/lib/payments/razorpay";
import {
  PRO_PLAN_AMOUNT_MINOR,
  PRO_PLAN_CURRENCY,
  PRO_PLAN_PRICE_LABEL,
} from "@/lib/payments/constants";
import { getAuthenticatedUser } from "@/lib/meetings/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BillingSchemaError,
  updateProfileByUserId,
} from "@/lib/supabase/profile-repository";

export async function POST() {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to upgrade." },
        { status: 401 },
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "Your account needs an email address to upgrade." },
        { status: 400 },
      );
    }

    logBillingDev("create-order:start", {
      userId: user.id,
      email: user.email,
    });

    assertRazorpayServerConfig();

    const profile = await getUserProfileForBilling();

    logBillingDev("create-order:profile", {
      userId: user.id,
      planType: profile?.plan_type ?? "free",
      razorpayCustomerId: profile?.razorpay_customer_id ?? null,
      hasPro: profile ? hasProAccess(profile) : false,
    });

    if (profile && hasProAccess(profile)) {
      return NextResponse.json(
        { error: "You already have an active Pro subscription." },
        { status: 400 },
      );
    }

    const razorpay = getRazorpay();
    const planId = getRazorpayPlanId();

    const customerId = await resolveRazorpayCustomerId(razorpay, {
      userId: user.id,
      email: user.email,
      name: profile?.full_name,
      storedCustomerId: profile?.razorpay_customer_id ?? null,
    });

    logBillingDev("create-order:subscription-create", {
      userId: user.id,
      customerId,
      planId,
    });

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120,
      notes: { user_id: user.id },
    });

    const admin = createAdminClient();

    await updateProfileByUserId(
      admin,
      user.id,
      {
        razorpay_customer_id: customerId,
        razorpay_subscription_id: subscription.id,
        subscription_status: subscription.status,
      },
      "create-order/update-profile",
    );

    logBillingDev("create-order:success", {
      userId: user.id,
      subscriptionId: subscription.id,
      customerId,
    });

    await recordBillingEvent({
      userId: user.id,
      type: "subscription_activated",
      status: subscription.status,
      amount: PRO_PLAN_AMOUNT_MINOR,
      currency: PRO_PLAN_CURRENCY,
      razorpayEventId: `checkout-init-${subscription.id}`,
      razorpaySubscriptionId: subscription.id,
      metadata: { source: "create_order", customer_id: customerId },
    });

    return NextResponse.json({
      keyId: getPublicRazorpayKeyId(),
      subscriptionId: subscription.id,
      amount: PRO_PLAN_AMOUNT_MINOR,
      currency: PRO_PLAN_CURRENCY,
      name: BRAND.name,
      description: `${BRAND.proPlanName} (${PRO_PLAN_PRICE_LABEL}) — unlimited meetings & AI`,
      prefill: {
        email: user.email,
        name: profile?.full_name ?? "",
      },
    });
  } catch (error) {
    console.error("[billing/create-order]", error);
    logBillingDev("create-order:error", {
      message: error instanceof Error ? error.message : String(error),
    });

    const message =
      error instanceof Error ? error.message : "Unknown billing error";
    const isDev = process.env.NODE_ENV === "development";

    if (error instanceof BillingSchemaError) {
      return NextResponse.json(
        {
          error: "Billing database is not ready.",
          hint: error.message,
        },
        { status: 503 },
      );
    }

    let hint: string | undefined;

    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      hint =
        "Add SUPABASE_SERVICE_ROLE_KEY to .env.local, then stop and restart `npm run dev`.";
    } else if (isDev && message.includes("RAZORPAY_PLAN_ID")) {
      hint = "Run npm run billing:setup-plan and add RAZORPAY_PLAN_ID to .env.local.";
    }

    return NextResponse.json(
      {
        error: hint ?? "Could not start checkout. Please try again or contact support.",
      },
      { status: 500 },
    );
  }
}
