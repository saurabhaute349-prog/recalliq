"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FREE_PLAN_MEETING_LIMIT,
  FREE_PLAN_MESSAGE_LIMIT,
} from "@/lib/meetings/constants";
import { PRO_PLAN_PRICE_LABEL } from "@/lib/payments/constants";

type UpgradeLimitModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: "meetings" | "messages";
};

export function UpgradeLimitModal({
  open,
  onOpenChange,
  reason = "messages",
}: UpgradeLimitModalProps) {
  const title =
    reason === "meetings"
      ? "Meeting limit reached"
      : "AI question limit reached";

  const description =
    reason === "meetings"
      ? `Free includes ${FREE_PLAN_MEETING_LIMIT} meetings. Upgrade for unlimited meeting memory.`
      : `Free includes ${FREE_PLAN_MESSAGE_LIMIT} AI questions per meeting. Upgrade for unlimited chat.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-primary/20 bg-background/95 backdrop-blur-xl sm:max-w-md"
        aria-describedby="upgrade-limit-desc"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription id="upgrade-limit-desc">
            {description} Pro is {PRO_PLAN_PRICE_LABEL}.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>· Unlimited meetings</li>
          <li>· Unlimited AI questions</li>
          <li>· Priority memory responses</li>
        </ul>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button asChild>
            <Link href="/billing">Upgrade to Pro</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
