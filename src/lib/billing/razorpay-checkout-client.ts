"use client";

import { toast } from "sonner";

import { BILLING_CHECKOUT_THEME_COLOR } from "@/lib/billing/constants";

export type RazorpayCheckoutPayload = {
  keyId: string;
  subscriptionId: string;
  name: string;
  description: string;
  prefill?: { email?: string; name?: string };
};

export type RazorpayCheckoutMode = "standard" | "upi_intent";

export type RazorpayCheckoutPhase = "idle" | "preparing" | "open";

export const QR_FALLBACK_MS = 5000;

export class CheckoutDismissedError extends Error {
  readonly code = "CHECKOUT_DISMISSED";

  constructor() {
    super("Checkout dismissed");
    this.name = "CheckoutDismissedError";
  }
}

export function logRazorpayCheckout(
  event: string,
  detail?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "development" && detail) {
    console.info(`[RazorpayCheckout] ${event}`, detail);
  } else {
    console.info(`[RazorpayCheckout] ${event}`);
  }
}

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Razorpay is only available in the browser."),
    );
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      logRazorpayCheckout("script_loaded");
      resolve();
    };
    script.onerror = () => {
      logRazorpayCheckout("script_error");
      reject(new Error("Could not load Razorpay checkout."));
    };
    document.body.appendChild(script);
  });
}

function buildDisplayConfig(mode: RazorpayCheckoutMode) {
  if (mode === "upi_intent") {
    return {
      blocks: {
        upi: {
          name: "Pay with UPI app",
          instruments: [{ method: "upi" }],
        },
      },
      sequence: ["block.upi"],
      preferences: {
        show_default_blocks: false,
      },
    };
  }

  return {
    blocks: {
      upi: {
        name: "UPI QR & apps",
        instruments: [{ method: "upi" }],
      },
      card: {
        name: "Cards & netbanking",
        instruments: [{ method: "card" }, { method: "netbanking" }],
      },
    },
    sequence: ["block.upi", "block.card"],
    preferences: {
      show_default_blocks: true,
    },
  };
}

function attachCheckoutListeners(
  checkout: RazorpayInstance,
  mode: RazorpayCheckoutMode,
): void {
  checkout.on("payment.failed", (response) => {
    logRazorpayCheckout("payment.failed", {
      mode,
      response: response as Record<string, unknown>,
    });
    toast.error("Payment could not be completed. Please try again.");
  });

  const extended = checkout as RazorpayInstance & {
    on?: (event: string, handler: (payload: unknown) => void) => void;
  };

  for (const eventName of [
    "payment.error",
    "modal.opened",
    "modal.closed",
    "modal.load.failed",
  ]) {
    try {
      extended.on?.(eventName, (payload) => {
        logRazorpayCheckout(eventName, {
          mode,
          payload: payload as Record<string, unknown>,
        });
      });
    } catch {
      // Not all events exist on every checkout build.
    }
  }
}

export type RunRazorpayCheckoutInput = {
  payload: RazorpayCheckoutPayload;
  mode?: RazorpayCheckoutMode;
  onPhaseChange?: (phase: RazorpayCheckoutPhase) => void;
  onQrFallback?: () => void;
};

/**
 * Opens Razorpay subscription checkout.
 * Callers must not show a full-screen overlay while phase is "open" (blocks QR iframe).
 */
export async function runRazorpayCheckout(
  input: RunRazorpayCheckoutInput,
): Promise<void> {
  const mode = input.mode ?? "standard";
  let settled = false;
  let fallbackTimer: number | null = null;

  const settle = (fn: () => void) => {
    if (settled) return;
    settled = true;
    if (fallbackTimer) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    document.body.classList.remove("razorpay-checkout-active");
    input.onPhaseChange?.("idle");
    fn();
  };

  input.onPhaseChange?.("preparing");
  logRazorpayCheckout("prepare", {
    mode,
    subscriptionId: input.payload.subscriptionId,
  });

  await loadRazorpayScript();

  return new Promise<void>((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: input.payload.keyId,
      subscription_id: input.payload.subscriptionId,
      name: input.payload.name,
      description: input.payload.description,
      prefill: input.payload.prefill,
      theme: {
        color: BILLING_CHECKOUT_THEME_COLOR,
        backdrop_color: "#f8fafc",
      },
      config: {
        display: buildDisplayConfig(mode) as NonNullable<
          RazorpayCheckoutOptions["config"]
        >["display"],
      },
      retry: {
        enabled: true,
        max_count: 3,
      },
      handler: async (response) => {
        logRazorpayCheckout("payment.success", { mode });
        try {
          const verifyResponse = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });

          const verifyData = (await verifyResponse.json()) as { error?: string };

          if (!verifyResponse.ok) {
            throw new Error(verifyData.error ?? "Payment verification failed.");
          }

          settle(() => resolve());
        } catch (error) {
          logRazorpayCheckout("verify.error", {
            message: error instanceof Error ? error.message : String(error),
          });
          settle(() => reject(error));
        }
      },
      modal: {
        backdropclose: true,
        escape: true,
        confirm_close: true,
        ondismiss: () => {
          logRazorpayCheckout("modal.dismiss", { mode });
          settle(() => reject(new CheckoutDismissedError()));
        },
      },
    });

    attachCheckoutListeners(checkout, mode);

    document.body.classList.add("razorpay-checkout-active");
    input.onPhaseChange?.("open");
    logRazorpayCheckout("modal.open", { mode });

    try {
      checkout.open();
    } catch (error) {
      logRazorpayCheckout("modal.open_error", {
        message: error instanceof Error ? error.message : String(error),
      });
      settle(() =>
        reject(
          error instanceof Error
            ? error
            : new Error("Could not open Razorpay checkout."),
        ),
      );
      return;
    }

    if (mode === "standard" && input.onQrFallback) {
      fallbackTimer = window.setTimeout(() => {
        if (settled) return;
        logRazorpayCheckout("qr_fallback_timeout");
        input.onQrFallback?.();
      }, QR_FALLBACK_MS);
    }
  });
}
