"use client";

import Link from "next/link";
import { useState } from "react";
import { Crown, ExternalLink, Loader2, RefreshCw } from "lucide-react";

import { BillingHistoryPlaceholder } from "@/components/billing/billing-history-placeholder";
import { CheckoutOverlay } from "@/components/billing/checkout-overlay";
import { useBillingActions } from "@/components/billing/use-billing-actions";
import { UsageMeter } from "@/components/billing/usage-meter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BRAND } from "@/lib/brand/config";
import { maskBillingId } from "@/lib/billing/mask-id";
import {
  formatBillingStatusCategory,
  getBillingStatusCategory,
  isSubscriptionEnding,
  needsPaymentRetry,
} from "@/lib/billing/plan";
import {
  FREE_PLAN_MEETING_LIMIT,
  FREE_PLAN_MESSAGE_LIMIT,
} from "@/lib/meetings/constants";
import { formatMeetingDate } from "@/lib/meetings/format";
import { PRO_PLAN_PRICE_LABEL } from "@/lib/payments/constants";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

type BillingSettingsProps = {
  profile: Profile | null;
  meetingsUsed: number;
  aiMessagesUsed: number;
  isPro: boolean;
};

const STATUS_STYLES = {
  active: "border-primary/25 bg-primary/10 text-primary",
  cancelled: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  past_due: "border-destructive/30 bg-destructive/10 text-destructive",
  inactive: "border-border bg-muted/30 text-muted-foreground",
} as const;

export function BillingSettings({
  profile,
  meetingsUsed,
  aiMessagesUsed,
  isPro,
}: BillingSettingsProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const {
    isCheckingOut,
    isCancelling,
    startCheckout,
    cancelSubscription,
  } = useBillingActions(isPro);

  const ending = isSubscriptionEnding(profile);
  const statusCategory = getBillingStatusCategory(
    profile?.subscription_status ?? null,
  );
  const statusLabel = formatBillingStatusCategory(statusCategory);
  const showRetry = needsPaymentRetry(profile, isPro);
  const canCancel =
    isPro &&
    profile?.razorpay_subscription_id &&
    !ending &&
    statusCategory === "active";

  const handleCancel = async () => {
    const ok = await cancelSubscription(profile?.razorpay_subscription_id);
    if (ok) setCancelOpen(false);
  };

  return (
    <section className="space-y-6">
      <CheckoutOverlay open={isCheckingOut} />

      <div className="space-y-6 rounded-xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              {isPro && <Crown className="size-4 shrink-0 text-primary" aria-hidden />}
              {isPro ? `${BRAND.proPlanName} Active` : "Free plan"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isPro
                ? `You're on ${BRAND.proPlanName} · ${PRO_PLAN_PRICE_LABEL}`
                : `Upgrade to ${BRAND.proPlanName} — ${PRO_PLAN_PRICE_LABEL}`}
            </p>
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                STATUS_STYLES[statusCategory],
              )}
            >
              Billing: {statusLabel}
            </span>
            {profile?.current_period_end && (
              <p className="text-xs text-muted-foreground">
                {ending ? "Access until" : "Renews"}{" "}
                <span className="font-medium text-foreground">
                  {formatMeetingDate(profile.current_period_end)}
                </span>
              </p>
            )}
            {ending && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Subscription ends at period close — no further charges.
              </p>
            )}
            {profile?.razorpay_subscription_id && (
              <p className="font-mono text-[11px] text-muted-foreground">
                Subscription ID:{" "}
                <span className="text-foreground">
                  {maskBillingId(profile.razorpay_subscription_id)}
                </span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!isPro && (
              <Button
                size="sm"
                onClick={() => void startCheckout()}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Upgrade to {BRAND.proPlanName}
              </Button>
            )}
            {showRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void startCheckout()}
                disabled={isCheckingOut}
              >
                <RefreshCw className="size-4" />
                Retry payment
              </Button>
            )}
            {isPro && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/billing">
                  <ExternalLink className="size-4" />
                  Manage subscription
                </Link>
              </Button>
            )}
          </div>
        </div>

        <UsageMeter
          label="Meetings this month"
          used={meetingsUsed}
          limit={isPro ? null : FREE_PLAN_MEETING_LIMIT}
        />

        <UsageMeter
          label="AI messages used"
          used={aiMessagesUsed}
          limit={isPro ? null : FREE_PLAN_MESSAGE_LIMIT}
        />

        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setCancelOpen(true)}
            disabled={isCancelling}
          >
            Cancel subscription
          </Button>
        )}
      </div>

      <BillingHistoryPlaceholder />

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent aria-describedby="settings-cancel-desc">
          <DialogHeader>
            <DialogTitle>Cancel {BRAND.proPlanName}?</DialogTitle>
            <DialogDescription id="settings-cancel-desc">
              You will keep Pro access until the end of your current billing
              period. You will not be charged again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep {BRAND.proPlanName}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleCancel()}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Cancel subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
