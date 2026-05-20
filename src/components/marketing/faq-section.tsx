"use client";

import { motion } from "framer-motion";

import { SectionLabel } from "@/components/marketing/section-label";
import { FAQ_ITEMS } from "@/lib/marketing/content";
import { fadeUp } from "@/lib/motion";

export function FAQSection() {
  return (
    <section className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <motion.div {...fadeUp} className="text-center">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Common questions
          </h2>
        </motion.div>
        <dl className="mt-10 space-y-6">
          {FAQ_ITEMS.map((item, index) => (
            <motion.div
              key={item.q}
              {...fadeUp}
              transition={{ delay: index * 0.04 }}
              className="rounded-xl border border-border/80 bg-card/40 px-5 py-4"
            >
              <dt className="text-sm font-medium text-foreground">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  );
}
