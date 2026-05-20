"use client";

import { Loader2 } from "lucide-react";

type CheckoutOverlayProps = {
  open: boolean;
  message?: string;
};

export function CheckoutOverlay({
  open,
  message = "Processing payment…",
}: CheckoutOverlayProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="alertdialog"
      aria-live="assertive"
      aria-busy="true"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-8 py-6 shadow-xl">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium">{message}</p>
        <p className="text-xs text-muted-foreground">
          Do not close this window until checkout completes.
        </p>
      </div>
    </div>
  );
}
