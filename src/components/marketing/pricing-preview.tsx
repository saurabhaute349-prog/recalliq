"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { PricingCards } from "@/components/pricing/pricing-cards";
import { SectionLabel } from "@/components/marketing/section-label";
import { fadeUp } from "@/lib/motion";

export function PricingPreview() {
  return (
    <section className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Start free. Upgrade when memory matters.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Simple plans. No enterprise sales calls.
          </p>
        </motion.div>
        <PricingCards className="mt-14" />
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link
            href="/pricing"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Compare full pricing →
          </Link>
        </p>
      </div>
    </section>
  );
}
