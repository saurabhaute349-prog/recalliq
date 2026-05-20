"use client";

import { motion } from "framer-motion";

import { SectionLabel } from "@/components/marketing/section-label";
import { MARKETING_FEATURES } from "@/lib/marketing/content";
import { fadeUp, fadeUpDelay } from "@/lib/motion";

export function FeatureGrid() {
  return (
    <section className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <motion.div {...fadeUp} className="max-w-2xl">
          <SectionLabel>Features</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need for meeting recall
          </h2>
          <p className="mt-4 text-muted-foreground">
            From upload to intelligence to search—built for product teams, founders,
            and agencies.
          </p>
        </motion.div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {MARKETING_FEATURES.map((feature, index) => (
            <motion.div
              key={feature.id}
              {...fadeUp}
              {...fadeUpDelay(index * 0.04)}
              className="group rounded-2xl border border-border/80 bg-card/60 p-6 transition-colors hover:border-primary/25 hover:bg-muted/20"
            >
              <feature.icon className="size-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                {feature.bullets.map((bullet) => (
                  <li key={bullet}>· {bullet}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
