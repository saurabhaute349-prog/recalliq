"use client";

import { useRouter } from "next/navigation";
import { startTransition, useCallback, useState } from "react";
import { toast } from "sonner";

import { BRAND } from "@/lib/brand/config";
import { BILLING_CHECKOUT_THEME_COLOR } from "@/lib/billing/constants";
import { formatMeetingDate } from "@/lib/meetings/format";
import { useMounted } from "@/hooks/use-mounted";

type CheckoutPayload = {
  keyId: string;
  subscriptionId: string;
  name: string;
  description: string;
  prefill?: { email?: string; name?: string };
};

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

export function useBillingActions(isPro: boolean) {
  const router = useRouter();
  const mounted = useMounted();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const refreshBilling = useCallback(() => {
    if (!mounted) return;
    startTransition(() => {
      router.refresh();
    });
  }, [mounted, router]);

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

  return {
    isCheckingOut,
    isCancelling,
    startCheckout,
    cancelSubscription,
    refreshBilling,
  };
}
