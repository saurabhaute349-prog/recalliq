"use client";

import { useRouter } from "next/navigation";
import { startTransition, useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { BRAND } from "@/lib/brand/config";
import { formatMeetingDate } from "@/lib/meetings/format";
import {
  CheckoutDismissedError,
  logRazorpayCheckout,
  runRazorpayCheckout,
  type RazorpayCheckoutPayload,
  type RazorpayCheckoutPhase,
} from "@/lib/billing/razorpay-checkout-client";
import { useMounted } from "@/hooks/use-mounted";

export function useBillingActions(isPro: boolean) {
  const router = useRouter();
  const mounted = useMounted();
  const [checkoutPhase, setCheckoutPhase] =
    useState<RazorpayCheckoutPhase>("idle");
  const [upiFallbackReady, setUpiFallbackReady] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const checkoutPayloadRef = useRef<RazorpayCheckoutPayload | null>(null);
  const upiFallbackOpenedRef = useRef(false);

  const refreshBilling = useCallback(() => {
    if (!mounted) return;
    startTransition(() => {
      router.refresh();
    });
  }, [mounted, router]);

  const openUpiIntentCheckout = useCallback(async () => {
    const payload = checkoutPayloadRef.current;
    if (!payload || upiFallbackOpenedRef.current) return;

    upiFallbackOpenedRef.current = true;
    setUpiFallbackReady(false);
    logRazorpayCheckout("qr_fallback_open_upi_intent");

    try {
      await runRazorpayCheckout({
        payload,
        mode: "upi_intent",
        onPhaseChange: setCheckoutPhase,
      });
      toast.success(`Welcome to ${BRAND.proPlanName}!`, {
        description: "Unlimited meetings and AI are now unlocked.",
      });
      refreshBilling();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message !== "Payment failed"
      ) {
        toast.error(
          error instanceof Error
            ? error.message
            : "UPI checkout could not be started.",
        );
      }
    } finally {
      upiFallbackOpenedRef.current = false;
      checkoutPayloadRef.current = null;
    }
  }, [refreshBilling]);

  const startCheckout = useCallback(async () => {
    if (isPro || checkoutPhase !== "idle") return;

    setUpiFallbackReady(false);
    upiFallbackOpenedRef.current = false;

    try {
      const orderResponse = await fetch("/api/billing/create-order", {
        method: "POST",
      });

      const orderData = (await orderResponse.json()) as RazorpayCheckoutPayload & {
        error?: string;
        hint?: string;
      };

      if (!orderResponse.ok) {
        const detail = [orderData.error, orderData.hint].filter(Boolean).join(" ");
        throw new Error(detail || "Could not start checkout.");
      }

      checkoutPayloadRef.current = orderData;

      await runRazorpayCheckout({
        payload: orderData,
        mode: "standard",
        onPhaseChange: setCheckoutPhase,
        onQrFallback: () => {
          setUpiFallbackReady(true);
          toast.info("QR slow to load?", {
            description: "Opening UPI app payment as a backup.",
            duration: 4000,
          });
          void openUpiIntentCheckout();
        },
      });

      toast.success(`Welcome to ${BRAND.proPlanName}!`, {
        description: "Unlimited meetings and AI are now unlocked.",
      });
      refreshBilling();
    } catch (error) {
      if (error instanceof CheckoutDismissedError) {
        return;
      }
      logRazorpayCheckout("checkout.error", {
        message: error instanceof Error ? error.message : String(error),
      });
      toast.error(
        error instanceof Error
          ? error.message
          : "Checkout could not be started. Please try again.",
      );
    } finally {
      checkoutPayloadRef.current = null;
      setUpiFallbackReady(false);
      setCheckoutPhase("idle");
    }
  }, [checkoutPhase, isPro, openUpiIntentCheckout, refreshBilling]);

  const cancelSubscription = useCallback(
    async (subscriptionId: string | null | undefined) => {
      if (!subscriptionId || isCancelling) return false;

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

        refreshBilling();
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not cancel. Please contact support.",
        );
        return false;
      } finally {
        setIsCancelling(false);
      }
    },
    [isCancelling, refreshBilling],
  );

  const isCheckingOut = checkoutPhase !== "idle";

  return {
    isCheckingOut,
    checkoutPhase,
    upiFallbackReady,
    isCancelling,
    startCheckout,
    openUpiIntentCheckout,
    cancelSubscription,
    refreshBilling,
  };
}

