import type { Metadata } from "next";

import { CTASection } from "@/components/marketing/cta-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { SectionLabel } from "@/components/marketing/section-label";
import { ComparisonMatrix } from "@/components/pricing/comparison-matrix";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { pageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = pageMetadata(
  "Pricing",
  "Free plan with 3 meetings. Pro at ₹999/month for unlimited AI meeting memory.",
);

export default function PricingPage() {
  return (
    <>
      <section className="border-b border-border py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
          <SectionLabel>Pricing</SectionLabel>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Simple plans for serious memory
          </h1>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade to Pro when your team depends on recall.
          </p>
        </div>
      </section>
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <PricingCards />
          <div className="mt-16">
            <h2 className="text-center text-xl font-semibold tracking-tight">
              Compare plans
            </h2>
            <ComparisonMatrix />
          </div>
        </div>
      </section>
      <FAQSection />
      <CTASection />
    </>
  );
}
