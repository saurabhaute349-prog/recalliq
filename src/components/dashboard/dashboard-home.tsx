"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  MessageSquare,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FREE_PLAN_MEETING_LIMIT,
  FREE_PLAN_MESSAGE_LIMIT,
} from "@/lib/meetings/constants";
import dynamic from "next/dynamic";

const DashboardStatsPanel = dynamic(
  () =>
    import("@/components/dashboard/dashboard-stats").then((m) => ({
      default: m.DashboardStatsPanel,
    })),
  { ssr: false, loading: () => null },
);
import { ClientGreeting } from "@/components/shared/client-greeting";
import { RelativeTime } from "@/components/shared/relative-time";
import type { DashboardStats } from "@/lib/dashboard/stats";
import { fadeIn, fadeInDelay } from "@/lib/motion";
import type { MeetingListItem } from "@/types/database";

const aiSuggestions = [
  "What were the action items?",
  "Summarize budget discussion",
  "Who owns next steps?",
  "What decisions were made?",
];

type DashboardHomeProps = {
  recentMeetings: MeetingListItem[];
  continueMeeting: MeetingListItem | null;
  meetingsUsed: number;
  isPro: boolean;
  stats: DashboardStats;
};

export function DashboardHome({
  recentMeetings,
  continueMeeting,
  meetingsUsed,
  isPro,
  stats,
}: DashboardHomeProps) {
  const [draft, setDraft] = useState("");
  const usagePercent = isPro
    ? 0
    : Math.min((meetingsUsed / FREE_PLAN_MEETING_LIMIT) * 100, 100);

  return (
    <div className="space-y-10 md:space-y-12">
      <motion.header {...fadeIn} className="space-y-2">
        <ClientGreeting className="text-sm text-muted-foreground" />
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Your meeting memory, ready when you need it.
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Paste a transcript, then ask anything. Recalliq keeps what was said
          so you never have to rewatch a recording.
        </p>
      </motion.header>

      {continueMeeting && (
        <motion.section {...fadeInDelay(0.04)}>
          <Link
            href={`/meetings/${continueMeeting.id}`}
            className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-5 transition-colors hover:bg-primary/10 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">
                Continue recent meeting
              </p>
              <p className="mt-1 truncate font-medium text-foreground">
                {continueMeeting.title}
              </p>
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                {continueMeeting.summary}
              </p>
            </div>
            <ArrowRight className="size-5 shrink-0 text-primary" />
          </Link>
        </motion.section>
      )}

      <DashboardStatsPanel stats={stats} />

      <motion.section {...fadeInDelay(0.05)}>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/50">
                  <Sparkles className="size-4 text-primary" />
                </span>
                <h3 className="text-lg font-semibold tracking-tight">
                  Paste a new transcript
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Drop notes from any call. We turn them into memory you can
                question later.
              </p>
            </div>
          </div>

          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Alex: Let's ship onboarding v2 by Friday.\nSarah: I'll sync with legal on pricing copy.\nYou: I'll schedule three user interviews this week.`}
            className="min-h-[140px] resize-none border-border bg-background text-sm leading-relaxed md:min-h-[160px]"
          />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Supports plain text from Zoom, Meet, Otter, or any notes app.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="h-9" asChild>
                <Link href="/new">
                  <Upload className="size-4" />
                  Upload file
                </Link>
              </Button>
              <Button className="h-9" asChild>
                <Link href="/new">
                  Add to memory
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-10 lg:grid-cols-[1fr_280px] lg:gap-8">
        <div className="space-y-10">
          <motion.section {...fadeInDelay(0.1)}>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold tracking-tight">
                  Recent meetings
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick up where you left off.
                </p>
              </div>
              <Link
                href="/meetings"
                className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                View all
              </Link>
            </div>

            {recentMeetings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No meetings yet.{" "}
                  <Link href="/new" className="font-medium text-foreground hover:underline">
                    Create your first memory
                  </Link>
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {recentMeetings.map((meeting, index) => (
                  <motion.li
                    key={meeting.id}
                    {...fadeInDelay(0.12 + index * 0.04)}
                  >
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="group block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-border hover:bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="truncate font-medium text-foreground transition-colors group-hover:text-primary">
                            {meeting.title}
                          </p>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="size-3 shrink-0" />
                            <RelativeTime isoDate={meeting.created_at} />
                          </p>
                          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {meeting.summary}
                          </p>
                        </div>
                        <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.section>

          <motion.section {...fadeInDelay(0.14)}>
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">
                Try asking
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {aiSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setDraft(suggestion)}
                  className="rounded-full border border-border bg-background px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted/50 hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.section>
        </div>

        <motion.aside
          {...fadeInDelay(0.12)}
          className="lg:sticky lg:top-20 lg:self-start"
        >
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {isPro ? "Pro plan" : "Free plan"}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {isPro ? (
                "Unlimited"
              ) : (
                <>
                  {meetingsUsed}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / {FREE_PLAN_MEETING_LIMIT} meetings
                  </span>
                </>
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPro
                ? "Unlimited meetings and AI questions."
                : `${FREE_PLAN_MESSAGE_LIMIT} AI questions per meeting on Free.`}
            </p>

            {!isPro && (
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            )}

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {isPro
                ? "You're on Recalliq Pro. Thank you for supporting the product."
                : "Upgrade for unlimited meetings and AI."}
            </p>

            {!isPro && (
              <Button variant="outline" className="mt-4 h-9 w-full" asChild>
                <Link href="/billing">Upgrade to Pro</Link>
              </Button>
            )}
          </div>

          <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground lg:text-left">
            Your transcripts are private to your workspace.
          </p>
        </motion.aside>
      </div>
    </div>
  );
}
