"use client";

import { useEffect, type ReactNode } from "react";

import { initAnalytics } from "@/lib/analytics/client";
import { initMonitoring } from "@/lib/monitoring/client";

type AnalyticsProviderProps = {
  children: ReactNode;
};

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    void initAnalytics();
    void initMonitoring();
  }, []);

  return children;
}
