"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PRICING_PLANS } from "@/lib/marketing/content";
import { fadeUpDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";

type PricingCardsProps = {
  className?: string;
};

export function PricingCards({ className }: PricingCardsProps) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-4xl gap-4 px-1 sm:gap-5 md:grid-cols-2 md:px-0",
        className,
      )}
    >
      {PRICING_PLANS.map((plan, index) => (
        <motion.div key={plan.id} {...fadeUpDelay(index * 0.08)}>
          <Card
            className={cn(
              "relative h-full shadow-none",
              plan.highlighted
                ? "border-primary/30 ring-1 ring-primary/15"
                : "border-border",
            )}
          >
            {"badge" in plan && plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-medium text-primary-foreground">
                {plan.badge}
              </span>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <p className="pt-2 text-3xl font-semibold tracking-tight">
                {plan.price}
                {plan.period && (
                  <span className="text-base font-normal text-muted-foreground">
                    {plan.period}
                  </span>
                )}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
