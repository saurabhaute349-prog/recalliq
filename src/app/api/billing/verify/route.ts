import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { recordBillingEvent } from "@/lib/billing/events";
import { hasProAccess } from "@/lib/billing/plan";
import { getUserProfileForBilling } from "@/lib/billing/queries";
import {
  subscriptionBelongsToUser,
  subscriptionOwnershipError,
} from "@/lib/billing/subscription-ownership";
import {
  fetchRazorpaySubscription,
  syncProfileFromSubscription,
  verifySubscriptionPaymentSignature,
} from "@/lib/billing/subscription";
import { sendUpgradeSuccessEmail } from "@/lib/email/send";
import { getRazorpay } from "@/lib/payments/razorpay";
import { PRO_PLAN_CURRENCY, PRO_PLAN_LABEL } from "@/lib/payments/constants";
import { getAuthenticatedUser } from "@/lib/meetings/queries";

const verifyBodySchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_subscription_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      );
    }

    const body = verifyBodySchema.parse(await request.json());
    const secret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!secret) {
      return NextResponse.json(
        { error: "Payment verification is not configured." },
        { status: 500 },
      );
    }

    const isValid = verifySubscriptionPaymentSignature({
      paymentId: body.razorpay_payment_id,
      subscriptionId: body.razorpay_subscription_id,
      signature: body.razorpay_signature,
      secret,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Payment verification failed. Please contact support." },
        { status: 400 },
      );
    }

    const billingProfile = await getUserProfileForBilling();

    const razorpay = getRazorpay();
    const subscription = await fetchRazorpaySubscription(
      razorpay,
      body.razorpay_subscription_id,
    );

    if (
      !subscriptionBelongsToUser(
        subscription,
        user.id,
        billingProfile?.razorpay_subscription_id,
      )
    ) {
      return NextResponse.json(
        { error: subscriptionOwnershipError() },
        { status: 403 },
      );
    }

    const profile = await syncProfileFromSubscription(user.id, subscription);

    await recordBillingEvent({
      userId: user.id,
      type: "subscription_activated",
      status: "captured",
      amount: null,
      currency: PRO_PLAN_CURRENCY,
      razorpayEventId: `checkout-${body.razorpay_payment_id}`,
      razorpayPaymentId: body.razorpay_payment_id,
      razorpaySubscriptionId: body.razorpay_subscription_id,
      metadata: { source: "checkout_verify" },
    });

    if (profile && hasProAccess(profile) && user.email) {
      await sendUpgradeSuccessEmail({
        to: user.email,
        name: profile.full_name ?? "there",
        planName: PRO_PLAN_LABEL,
        currentPeriodEnd: profile.current_period_end,
      });
    }

    revalidatePath("/billing");
    revalidatePath("/dashboard");
    revalidatePath("/meetings");
    revalidatePath("/new");

    return NextResponse.json({
      success: true,
      planType: profile?.plan_type ?? "pro",
      subscriptionStatus: profile?.subscription_status ?? null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payment response." },
        { status: 400 },
      );
    }

    console.error("[billing/verify]", error);

    return NextResponse.json(
      { error: "Could not verify payment. Please contact support." },
      { status: 500 },
    );
  }
}
