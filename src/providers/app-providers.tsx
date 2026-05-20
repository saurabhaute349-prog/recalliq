"use client";

import type { ReactNode } from "react";

import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { Toaster } from "@/components/ui/sonner";

import { ThemeProvider } from "./theme-provider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <AnalyticsProvider>
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </AnalyticsProvider>
    </ThemeProvider>
  );
}
