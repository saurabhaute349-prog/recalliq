"use client";

import { motion } from "framer-motion";
import { Crown, Trash2, User } from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { ReplayOnboardingButton } from "@/components/settings/replay-onboarding-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FREE_PLAN_MEETING_LIMIT,
  FREE_PLAN_MESSAGE_LIMIT,
} from "@/lib/meetings/constants";
import { getPlanDisplayName } from "@/lib/billing/plan";
import { fadeIn, fadeInDelay } from "@/lib/motion";
import type { Profile } from "@/types/database";

type SettingsViewProps = {
  email: string;
  displayName: string | null;
  profile: Profile | null;
  meetingsUsed: number;
  isPro: boolean;
};

export function SettingsView({
  email,
  displayName,
  profile,
  meetingsUsed,
  isPro,
}: SettingsViewProps) {
  const planLabel = getPlanDisplayName(profile);
  const meetingLimit = isPro ? null : FREE_PLAN_MEETING_LIMIT;

  return (
    <motion.div className="mx-auto w-full max-w-2xl space-y-8">
      <motion.header {...fadeIn} className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Account, plan, and preferences.
        </p>
      </motion.header>

      <motion.section
        {...fadeInDelay(0.04)}
        className="rounded-xl border border-border bg-card p-5 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full border border-border bg-muted/40">
            <User className="size-4 text-primary" />
          </span>
          <motion.div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {displayName || "Recalliq user"}
            </p>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        {...fadeInDelay(0.06)}
        className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Plan
            </p>
            <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
              {isPro && <Crown className="size-4 text-primary" />}
              {planLabel}
            </p>
          </div>
          {!isPro && (
            <Button size="sm" asChild>
              <Link href="/billing">Upgrade</Link>
            </Button>
          )}
        </div>

        <Separator />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Meetings used</span>
            <span className="font-medium tabular-nums">
              {meetingsUsed}
              {meetingLimit != null ? ` / ${meetingLimit}` : " (unlimited)"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">AI questions per meeting</span>
            <span className="font-medium">
              {isPro ? "Unlimited" : `${FREE_PLAN_MESSAGE_LIMIT} (free)`}
            </span>
          </div>
        </div>

        <Link
          href="/billing"
          className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Manage billing
        </Link>
      </motion.section>

      <motion.section
        {...fadeInDelay(0.08)}
        className="rounded-xl border border-border bg-card p-5 shadow-sm"
      >
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Appearance
        </p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Theme</p>
          <ThemeToggle />
        </div>
      </motion.section>

      <motion.section
        {...fadeInDelay(0.09)}
        className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3"
      >
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Help
        </p>
        <ReplayOnboardingButton />
        <p className="text-xs text-muted-foreground">
          Keyboard: <kbd className="rounded border px-1 font-mono text-[10px]">⌘K</kbd>{" "}
          opens quick search from anywhere in the app.
        </p>
      </motion.section>

      <motion.section
        {...fadeInDelay(0.1)}
        className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4"
      >
        <LogoutButton showLabel className="w-full" variant="outline" />

        <Separator />

        <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-4">
          <Trash2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Account deletion is not available yet. Contact support if you need
              your data removed.
            </p>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
