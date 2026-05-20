"use client";

import { motion } from "framer-motion";

import { SectionLabel } from "@/components/marketing/section-label";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HOW_IT_WORKS } from "@/lib/marketing/content";
import { fadeUp, fadeUpDelay } from "@/lib/motion";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Upload. Extract. Ask forever.
          </h2>
          <p className="mt-4 text-muted-foreground">
            A three-step loop that turns every transcript into lasting team memory.
          </p>
        </motion.div>
        <div className="relative mt-14">
          <motion.div
            className="absolute left-0 right-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
            aria-hidden
          />
          <div className="grid gap-5 md:grid-cols-3">
            {HOW_IT_WORKS.map((item, index) => (
              <motion.div key={item.title} {...fadeUp} {...fadeUpDelay(index * 0.06)}>
                <Card className="relative h-full border-border/80 bg-card/80 shadow-none backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted/50">
                        <item.icon className="size-4 text-primary" />
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {item.step}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
