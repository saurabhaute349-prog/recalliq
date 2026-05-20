"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  ListChecks,
  MessageCircle,
  Zap,
} from "lucide-react";

import { TranscriptUploadPanel } from "@/components/meetings/transcript-upload-panel";
import { FREE_PLAN_MEETING_LIMIT } from "@/lib/meetings/constants";
import { fadeIn, fadeInDelay } from "@/lib/motion";

const sampleTranscripts = [
  {
    id: "sales",
    label: "Sales call",
    content: `Rep: Thanks for joining today. What prompted you to look at Recalliq now?

Prospect: We lose context after every customer call. Notes live in Slack threads nobody reads.

Rep: That's exactly what we solve—transcript to searchable memory. You can ask "what were next steps?" weeks later.

Prospect: If it works with Zoom exports, we'd pilot with the sales team next month.`,
  },
  {
    id: "product",
    label: "Product meeting",
    content: `Alex: Let's ship onboarding v2 by Friday.

Sarah: I'll own copy review with legal by Wednesday.

Marcus: We should defer the analytics panel—focus on transcript chat first.

You: I'll schedule three user interviews before sprint planning on Monday.`,
  },
  {
    id: "hiring",
    label: "Hiring interview",
    content: `Interviewer: Tell me about a time you shipped something ambiguous.

Candidate: I led a zero-to-one feature with unclear requirements. I ran weekly transcript reviews with stakeholders and turned meetings into written decisions.

Interviewer: How do you handle conflicting feedback?

Candidate: I document who said what and surface tradeoffs early—memory beats momentum when alignment matters.`,
  },
  {
    id: "standup",
    label: "Team standup",
    content: `Jamie: Yesterday I finished the memory ingestion spike. Today I'm wiring the chat UI.

Priya: Blocked on design tokens—need sign-off by EOD.

Sam: No blockers. I'll review Jamie's PR after standup.

You: Decision—we ship internal dogfood Friday, external beta next week.`,
  },
];

const aiCapabilities = [
  { label: "Extract action items", icon: ListChecks },
  { label: "Find decisions", icon: CheckCircle2 },
  { label: "Summarize instantly", icon: Zap },
  { label: "Ask follow-up questions", icon: MessageCircle },
];

const sideTips = [
  {
    title: "Best transcripts",
    body: "Speaker labels and timestamps help Recalliq cite who said what.",
  },
  {
    title: "Supported formats",
    body: ".txt, .pdf, .docx, .srt, .vtt, and exports from Zoom, Meet, Otter, or Fireflies.",
  },
  {
    title: "Free plan",
    body: `${FREE_PLAN_MEETING_LIMIT} meetings included on the free plan. Upgrade anytime for unlimited.`,
  },
];

const PLACEHOLDER = `Paste your meeting transcript here…

Example:
Alex: Let's align on the launch timeline.
Sarah: I'll own the onboarding copy by Friday.
You: I'll schedule customer interviews before sprint planning.`;

export default function NewMeetingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl lg:max-w-5xl">
      <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-10 xl:gap-14">
        <div className="min-w-0 space-y-8 md:space-y-10">
          <motion.header {...fadeIn} className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              New meeting memory
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Upload or paste any meeting transcript—Recalliq extracts,
              cleans, and turns it into searchable AI memory.
            </p>
          </motion.header>

          <motion.div {...fadeInDelay(0.05)}>
            <TranscriptUploadPanel
              sampleTranscripts={sampleTranscripts}
              placeholder={PLACEHOLDER}
            />
          </motion.div>

          <motion.section {...fadeInDelay(0.12)}>
            <p className="mb-3 text-center text-xs font-medium tracking-wide text-muted-foreground uppercase lg:text-left">
              What you can do next
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {aiCapabilities.map((cap) => (
                <div
                  key={cap.label}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-center shadow-sm sm:items-start sm:text-left"
                >
                  <cap.icon className="size-4 text-primary" />
                  <span className="text-xs leading-snug text-muted-foreground sm:text-sm">
                    {cap.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        <motion.aside
          {...fadeInDelay(0.1)}
          className="hidden space-y-5 lg:block"
        >
          {sideTips.map((tip) => (
            <div
              key={tip.title}
              className="rounded-xl border border-border/80 bg-muted/20 p-4"
            >
              <p className="text-xs font-medium text-foreground">{tip.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {tip.body}
              </p>
            </div>
          ))}
        </motion.aside>
      </div>
    </div>
  );
}
