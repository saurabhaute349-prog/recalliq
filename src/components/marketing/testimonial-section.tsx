"use client";

import { motion } from "framer-motion";

import { SectionLabel } from "@/components/marketing/section-label";
import {
  LOGO_PLACEHOLDERS,
  MARKETING_STATS,
  TESTIMONIALS,
} from "@/lib/marketing/content";
import { fadeUp, fadeUpDelay } from "@/lib/motion";

export function TestimonialSection() {
  return (
    <section className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <motion.div {...fadeUp} className="text-center">
          <SectionLabel>Social proof</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Teams who refuse to lose context
          </h2>
          <motion.div className="mt-10 grid gap-6 sm:grid-cols-3">
            {MARKETING_STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                {...fadeUpDelay(i * 0.05)}
                className="rounded-xl border border-border/80 bg-card/50 px-4 py-5"
              >
                <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {LOGO_PLACEHOLDERS.map((name) => (
              <span
                key={name}
                className="text-sm font-medium tracking-tight text-muted-foreground/70"
              >
                {name}
              </span>
            ))}
          </div>
        </motion.div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <motion.blockquote
              key={item.name}
              {...fadeUp}
              {...fadeUpDelay(index * 0.06)}
              className="rounded-2xl border border-border/80 bg-muted/15 p-6 text-left"
            >
              <p className="text-sm leading-relaxed text-foreground">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="mt-4 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{item.name}</span>
                {" · "}
                {item.role}, {item.company}
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
