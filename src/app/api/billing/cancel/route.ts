import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { cancelSubscriptionAtPeriodEnd } from "@/lib/billing/cancel-subscription";
import { getUserProfileForBilling } from "@/lib/billing/queries";
import { sendSubscriptionCancelledEmail } from "@/lib/email/send";
import { getAuthenticatedUser } from "@/lib/meetings/queries";

export async function POST() {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      );
    }

    const profile = await getUserProfileForBilling();

    if (!profile?.razorpay_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found." },
        { status: 400 },
      );
    }

    const updated = await cancelSubscriptionAtPeriodEnd(
      user.id,
      profile.razorpay_subscription_id,
    );

    if (user.email) {
      await sendSubscriptionCancelledEmail({
        to: user.email,
        name: profile.full_name ?? "there",
        accessUntil: updated?.current_period_end ?? profile.current_period_end,
      });
    }

    revalidatePath("/billing");
    revalidatePath("/dashboard");
    revalidatePath("/meetings");
    revalidatePath("/new");

    return NextResponse.json({
      success: true,
      currentPeriodEnd: updated?.current_period_end ?? null,
    });
  } catch (error) {
    console.error("[billing/cancel]", error);

    return NextResponse.json(
      { error: "Could not cancel subscription. Please contact support." },
      { status: 500 },
    );
  }
}
