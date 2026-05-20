import type { Metadata } from "next";

import { CTASection } from "@/components/marketing/cta-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { SectionLabel } from "@/components/marketing/section-label";
import { pageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = pageMetadata(
  "Features",
  "AI meeting memory, transcript chat, action items, search, and team knowledge base.",
);

export default function FeaturesPage() {
  return (
    <>
      <section className="border-b border-border py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
          <SectionLabel>Features</SectionLabel>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Built for meeting recall at scale
          </h1>
          <p className="mt-4 text-muted-foreground">
            Everything you need to turn transcripts into searchable company memory.
          </p>
        </div>
      </section>
      <FeatureGrid />
      <FAQSection />
      <CTASection />
    </>
  );
}
