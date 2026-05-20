"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

import { ProductPreview } from "@/components/marketing/product-preview";
import { Button } from "@/components/ui/button";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { trackClientEvent } from "@/lib/analytics/client";
import { fadeUp } from "@/lib/motion";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24">
        <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary">Your AI meeting memory</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance md:text-5xl md:leading-[1.08]">
            Never Lose a Meeting Insight Again
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Recalliq transforms conversations into searchable AI memory.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link
                href="/signup"
                onClick={() =>
                  trackClientEvent(AnalyticsEvents.marketingCta, {
                    placement: "hero_primary",
                  })
                }
              >
                Start Free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/new">
                <Play className="size-4" />
                View Demo
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            No credit card · Works with any transcript · Setup in under a minute
          </p>
        </motion.div>
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-14 max-w-5xl"
        >
          <ProductPreview />
        </motion.div>
      </div>
    </section>
  );
}
