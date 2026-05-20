import type { ReactNode } from "react";

import { MarketingHeader } from "@/components/marketing/marketing-header";
import { FooterSection } from "@/components/marketing/footer-section";
import { defaultMetadata } from "@/lib/seo/site";

export const metadata = defaultMetadata;

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <main>{children}</main>
      <FooterSection />
    </div>
  );
}
