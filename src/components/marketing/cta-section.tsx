"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { trackClientEvent } from "@/lib/analytics/client";
import { fadeUp } from "@/lib/motion";

export function CTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
        <motion.div {...fadeUp}>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Stop rewatching. Start remembering.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Your next meeting does not have to disappear. Give your team memory that
            answers back.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link
                href="/signup"
                onClick={() =>
                  trackClientEvent(AnalyticsEvents.marketingCta, {
                    placement: "footer_cta",
                  })
                }
              >
                Get Started Free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
