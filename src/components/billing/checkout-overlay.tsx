"use client";

import { Loader2 } from "lucide-react";

import type { RazorpayCheckoutPhase } from "@/lib/billing/razorpay-checkout-client";
import { cn } from "@/lib/utils";

type CheckoutOverlayProps = {
  phase: RazorpayCheckoutPhase;
  onOpenUpiFallback?: () => void;
  upiFallbackReady?: boolean;
};

export function CheckoutOverlay({
  phase,
  onOpenUpiFallback,
  upiFallbackReady = false,
}: CheckoutOverlayProps) {
  if (phase === "idle") return null;

  if (phase === "open") {
    return (
      <>
        {upiFallbackReady && onOpenUpiFallback && (
          <div
            className="fixed inset-x-0 bottom-0 z-[90] flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none"
            role="status"
            aria-live="polite"
          >
            <button
              type="button"
              onClick={onOpenUpiFallback}
              className={cn(
                "pointer-events-auto max-w-md rounded-xl border border-primary/30 bg-card px-4 py-3 text-center text-sm shadow-lg",
                "transition-colors hover:bg-muted/80",
              )}
            >
              <span className="font-medium text-foreground">
                QR not loading?
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Tap to pay with UPI apps instead
              </span>
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-[2px]"
      role="alertdialog"
      aria-live="assertive"
      aria-busy="true"
      aria-label="Generating secure QR"
    >
      <div className="mx-4 flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-border bg-card px-8 py-6 shadow-xl">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm font-medium">Generating secure QR…</p>
        <p className="text-center text-xs text-muted-foreground">
          Opening Razorpay checkout. This only takes a moment.
        </p>
        <div
          className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted"
          aria-hidden
        >
          <div className="h-full w-2/3 animate-pulse rounded-full bg-primary/60" />
        </div>
      </div>
    </div>
  );
}
