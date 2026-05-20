import { CTASection } from "@/components/marketing/cta-section";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { PricingPreview } from "@/components/marketing/pricing-preview";
import { TestimonialSection } from "@/components/marketing/testimonial-section";

export default function MarketingPage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <FeatureGrid />
      <TestimonialSection />
      <PricingPreview />
      <CTASection />
    </>
  );
}
