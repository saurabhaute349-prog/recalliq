"use client";

import { motion } from "framer-motion";
import {
  Check,
  CreditCard,
  Crown,
  Globe,
  Loader2,
  MessageSquare,
  Shield,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useCallback, useState } from "react";
import { toast } from "sonner";

import { useMounted } from "@/hooks/use-mounted";

import { CheckoutOverlay } from "@/components/billing/checkout-overlay";
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
import { BILLING_CHECKOUT_THEME_COLOR } from "@/lib/billing/constants";
import {
  formatSubscriptionStatus,
  getPlanDisplayName,
  isSubscriptionEnding,
} from "@/lib/billing/plan";
import {
  FREE_PLAN_MEETING_LIMIT,
  FREE_PLAN_MESSAGE_LIMIT,
} from "@/lib/meetings/constants";
import { formatMeetingDate } from "@/lib/meetings/format";
import { fadeIn, fadeInDelay } from "@/lib/motion";
import { PRO_PLAN_PRICE_LABEL } from "@/lib/payments/constants";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

type CheckoutPayload = {
  keyId: string;
  subscriptionId: string;
  name: string;
  description: string;
  prefill?: { email?: string; name?: string };
};

type BillingViewProps = {
  profile: Profile | null;
  meetingsUsed: number;
  aiMessagesUsed: number;
  isPro: boolean;
};

const comparisonRows = [
  { feature: "Meeting memories", free: "3", pro: "Unlimited" },
  { feature: "AI questions", free: "5 / meeting", pro: "Unlimited" },
  { feature: "Transcript search", free: true, pro: true },
  { feature: "Priority memory", free: false, pro: true },
  { feature: "Cancel anytime", free: false, pro: true },
] as const;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay is only available in the browser."));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto size-4 text-primary" />
    ) : (
      <X className="mx-auto size-4 text-muted-foreground/50" />
    );
  }

  return <span className="text-sm text-foreground">{value}</span>;
}

export function BillingView({
  profile,
  meetingsUsed,
  aiMessagesUsed,
  isPro,
}: BillingViewProps) {
  const router = useRouter();
  const mounted = useMounted();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const refreshBilling = useCallback(() => {
    if (!mounted) return;
    startTransition(() => {
      router.refresh();
    });
  }, [mounted, router]);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const planName = getPlanDisplayName(profile);
  const meetingsPercent = Math.min(
    (meetingsUsed / FREE_PLAN_MEETING_LIMIT) * 100,
    100,
  );
  const ending = isSubscriptionEnding(profile);
  const isTestMode =
    typeof process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID === "string" &&
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.startsWith("rzp_test_");

  const startCheckout = useCallback(async () => {
    if (isPro || isCheckingOut) return;

    setIsCheckingOut(true);

    try {
      const orderResponse = await fetch("/api/billing/create-order", {
        method: "POST",
      });

      const orderData = (await orderResponse.json()) as CheckoutPayload & {
        error?: string;
        hint?: string;
      };

      if (!orderResponse.ok) {
        const detail = [orderData.error, orderData.hint].filter(Boolean).join(" ");
        throw new Error(detail || "Could not start checkout.");
      }

      await loadRazorpayScript();

      await new Promise<void>((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: orderData.keyId,
          subscription_id: orderData.subscriptionId,
          name: orderData.name,
          description: orderData.description,
          prefill: orderData.prefill,
          theme: { color: BILLING_CHECKOUT_THEME_COLOR },
          config: {
            display: {
              preferences: { show_default_blocks: true },
            },
          },
          handler: async (response) => {
            try {
              const verifyResponse = await fetch("/api/billing/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              });

              const verifyData = (await verifyResponse.json()) as {
                error?: string;
              };

              if (!verifyResponse.ok) {
                throw new Error(
                  verifyData.error ?? "Payment verification failed.",
                );
              }

              toast.success(`Welcome to ${BRAND.proPlanName}!`, {
                description: "Unlimited meetings and AI are now unlocked.",
              });
              refreshBilling();
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => {
              setIsCheckingOut(false);
              resolve();
            },
          },
        });

        checkout.on("payment.failed", () => {
          toast.error("Payment could not be completed. Please try again.");
          setIsCheckingOut(false);
          reject(new Error("Payment failed"));
        });

        checkout.open();
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Checkout could not be started. Please try again.",
      );
    } finally {
      setIsCheckingOut(false);
    }
  }, [isCheckingOut, isPro, refreshBilling]);

  const cancelSubscription = useCallback(async () => {
    if (!profile?.razorpay_subscription_id || isCancelling) return;

    setIsCancelling(true);

    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" });
      const data = (await response.json()) as {
        error?: string;
        currentPeriodEnd?: string | null;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not cancel subscription.");
      }

      toast.success("Subscription cancelled", {
        description: data.currentPeriodEnd
          ? `Pro access continues until ${formatMeetingDate(data.currentPeriodEnd)}.`
          : "You will not be charged again.",
      });

      setCancelOpen(false);
      refreshBilling();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not cancel. Please contact support.",
      );
    } finally {
      setIsCancelling(false);
    }
  }, [isCancelling, profile?.razorpay_subscription_id, refreshBilling]);

  return (
  <>
    <CheckoutOverlay open={isCheckingOut} />
    <motion.div {...fadeIn} className="mx-auto w-full max-w-4xl space-y-10">
      <motion.header {...fadeIn} className="space-y-2">
        <motion.div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">Billing</p>
          {isTestMode && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
              Test mode
            </span>
          )}
        </motion.div>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Plans & billing
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Upgrade to Pro for unlimited meeting memory and AI. Secure payments by
          Razorpay — cards, UPI, and international cards where enabled on your
          account.
        </p>
      </motion.header>

      <motion.section
        {...fadeInDelay(0.05)}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
      >
        <motion.div className="flex flex-wrap items-start justify-between gap-4">
          <motion.div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Current plan
            </p>
            <motion.div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-semibold tracking-tight">
                {planName}
              </h3>
              {isPro && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  <Crown className="size-3" />
                  {ending ? "Ending" : "Active"}
                </span>
              )}
            </motion.div>
            <p className="text-sm text-muted-foreground">
              {isPro
                ? "Unlimited meetings and AI on every memory."
                : `Free plan — ${FREE_PLAN_MEETING_LIMIT} meetings, ${FREE_PLAN_MESSAGE_LIMIT} AI questions per meeting.`}
            </p>
          </motion.div>
          {!isPro && (
            <Button
              className="h-10"
              onClick={() => void startCheckout()}
              disabled={isCheckingOut}
            >
              {isCheckingOut ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Zap className="size-4" />
              )}
              Upgrade to Pro
            </Button>
          )}
        </motion.div>

        {isPro && (
          <motion.div className="mt-6 space-y-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
            {profile?.current_period_end && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {ending ? "Access until" : "Renews"}
                </span>{" "}
                {formatMeetingDate(profile.current_period_end)}
              </p>
            )}
            {profile?.subscription_status && (
              <p className="text-muted-foreground">
                Status:{" "}
                <span className="text-foreground">
                  {formatSubscriptionStatus(profile.subscription_status)}
                </span>
              </p>
            )}
            {profile?.razorpay_subscription_id && !ending && (
              <Button
                variant="outline"
                size="sm"
                className="mt-1 h-8"
                onClick={() => setCancelOpen(true)}
                disabled={isCancelling}
              >
                Cancel subscription
              </Button>
            )}
          </motion.div>
        )}

        <motion.div className="mt-8 grid gap-4 sm:grid-cols-2">
          <motion.div className="rounded-xl border border-border bg-background/50 p-4">
            <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <Sparkles className="size-3.5" />
              Meetings
            </p>
            <p className="mt-2 text-xl font-semibold tracking-tight">
              {isPro ? (
                "Unlimited"
              ) : (
                <>
                  {meetingsUsed}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {FREE_PLAN_MEETING_LIMIT}
                  </span>
                </>
              )}
            </p>
            {!isPro && (
              <motion.div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${meetingsPercent}%` }}
                />
              </motion.div>
            )}
          </motion.div>

          <motion.div className="rounded-xl border border-border bg-background/50 p-4">
            <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <MessageSquare className="size-3.5" />
              AI messages
            </p>
            <p className="mt-2 text-xl font-semibold tracking-tight">
              {isPro ? "Unlimited" : `${aiMessagesUsed} sent`}
            </p>
            {!isPro && (
              <p className="mt-1 text-xs text-muted-foreground">
                Max {FREE_PLAN_MESSAGE_LIMIT} per meeting
              </p>
            )}
          </motion.div>
        </motion.div>
      </motion.section>

      <motion.section
        {...fadeInDelay(0.08)}
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <motion.div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold tracking-tight">
            Free vs Pro
          </h3>
        </motion.div>
        <motion.div className="grid grid-cols-3 gap-px bg-border text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <motion.div className="bg-card px-4 py-3 text-left">Feature</motion.div>
          <motion.div className="bg-card px-4 py-3">Free</motion.div>
          <motion.div className="bg-card px-4 py-3 text-primary">Pro</motion.div>
        </motion.div>
        {comparisonRows.map((row) => (
          <motion.div
            key={row.feature}
            className="grid grid-cols-3 gap-px border-t border-border bg-border"
          >
            <motion.div className="bg-card px-4 py-3 text-left text-sm text-foreground">
              {row.feature}
            </motion.div>
            <motion.div className="flex items-center justify-center bg-card px-4 py-3">
              <CellValue value={row.free} />
            </motion.div>
            <motion.div className="flex items-center justify-center bg-card px-4 py-3">
              <CellValue value={row.pro} />
            </motion.div>
          </motion.div>
        ))}
      </motion.section>

      <motion.section
        {...fadeInDelay(0.1)}
        className="grid gap-6 md:grid-cols-2"
      >
        <motion.div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Free
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">₹0</p>
          <p className="text-sm text-muted-foreground">Forever</p>
          <Button
            variant="outline"
            className="mt-6 h-9 w-full"
            disabled={!isPro}
          >
            {isPro ? "Previous plan" : "Current plan"}
          </Button>
        </motion.div>

        <motion.div
          className={cn(
            "rounded-2xl border bg-card p-6 shadow-sm",
            isPro ? "border-primary/40 ring-1 ring-primary/20" : "border-primary/30",
          )}
        >
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            Pro
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {PRO_PLAN_PRICE_LABEL}
          </p>
          <p className="text-sm text-muted-foreground">
            Billed monthly in INR via Razorpay
          </p>
          <Button
            className="mt-6 h-9 w-full"
            onClick={() => void startCheckout()}
            disabled={isPro || isCheckingOut}
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Opening checkout…
              </>
            ) : isPro ? (
              "You're on Pro"
            ) : (
              "Upgrade to Pro"
            )}
          </Button>
        </motion.div>
      </motion.section>

      <motion.footer
        {...fadeInDelay(0.12)}
        className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
      >
        <motion.p className="flex items-center gap-2">
          <Shield className="size-3.5 shrink-0" />
          Payments verified server-side. We never store card details.
        </motion.p>
        <motion.p className="flex items-center gap-2">
          <Globe className="size-3.5 shrink-0" />
          INR billing via Razorpay test mode
        </motion.p>
        <motion.p className="flex items-center gap-2">
          <CreditCard className="size-3.5 shrink-0" />
          UPI · Cards · Netbanking
        </motion.p>
      </motion.footer>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Pro subscription?</DialogTitle>
            <DialogDescription>
              You will keep Pro access until the end of your current billing
              period. You will not be charged again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep Pro
            </Button>
            <Button
              variant="destructive"
              onClick={() => void cancelSubscription()}
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
    </motion.div>
  </>
  );
}
