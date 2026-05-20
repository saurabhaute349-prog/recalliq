"use client";

import { motion } from "framer-motion";
import { CheckCircle2, MessageSquare, Sparkles } from "lucide-react";

import { GlassCard } from "@/components/ui/premium/glass-card";
import { BRAND } from "@/lib/brand/config";

const floatingCards = [
  {
    title: "Action items",
    body: "Sarah — onboarding v2 by Friday",
    icon: CheckCircle2,
    className: "left-4 top-6 md:left-8",
    delay: 0,
  },
  {
    title: "You asked",
    body: "What were the blockers?",
    icon: MessageSquare,
    className: "right-4 top-12 md:right-10",
    delay: 0.08,
  },
  {
    title: "Intelligence",
    body: "3 decisions · 2 deadlines detected",
    icon: Sparkles,
    className: "bottom-6 left-1/2 -translate-x-1/2 md:bottom-8",
    delay: 0.16,
  },
] as const;

export function ProductPreview() {
  return (
    <div className="relative">
      <motion.div
        className="pointer-events-none absolute -inset-4 rounded-3xl bg-primary/10 blur-3xl"
        aria-hidden
      />
      <GlassCard className="relative overflow-hidden border-primary/15 p-0 shadow-xl shadow-primary/5">
        <div className="flex items-center gap-2 border-b border-border/80 bg-muted/30 px-4 py-3">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="ml-2 text-xs text-muted-foreground">
            {`${BRAND.name} · Product sync`}
          </span>
        </div>
        <div className="grid gap-0 md:grid-cols-[1fr_1.1fr]">
          <div className="border-b border-border/80 p-5 md:border-b-0 md:border-r">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Transcript
            </p>
            <p className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">
              <span className="text-foreground">Alex:</span> Ship onboarding v2 by
              Friday if QA passes Monday.
              <br />
              <span className="text-foreground">Sarah:</span> I will own wizard UX
              and the demo flow.
            </p>
          </div>
          <div className="space-y-4 p-5">
            <div className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2 text-sm">
              What were the action items?
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed">
              <p className="text-xs font-medium text-primary">
                Based on Sarah&apos;s comments
              </p>
              <ul className="mt-2 space-y-1.5 text-muted-foreground">
                <li>• Sarah — wizard UX + demo flow</li>
                <li>• Alex — ship onboarding v2 by Friday</li>
              </ul>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Detected from transcript · 14:02
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
      {floatingCards.map((card) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: card.delay, duration: 0.4 }}
          className={`absolute hidden max-w-[200px] rounded-xl border border-border/80 bg-card/95 p-3 shadow-lg backdrop-blur-sm md:block ${card.className}`}
        >
          <div className="flex items-center gap-2">
            <card.icon className="size-3.5 text-primary" />
            <p className="text-xs font-medium">{card.title}</p>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{card.body}</p>
        </motion.div>
      ))}
    </div>
  );
}
