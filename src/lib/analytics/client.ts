"use client";

import type { PostHog } from "posthog-js";

import { logAnalyticsDev } from "@/lib/analytics/log";
import type {
  AnalyticsEventName,
  AnalyticsProperties,
} from "@/lib/analytics/events";

let posthog: PostHog | null = null;
let initStarted = false;

function getPostHogKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY;
}

function getPostHogHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
}

export function isAnalyticsEnabled(): boolean {
  return Boolean(getPostHogKey());
}

export async function initAnalytics(): Promise<void> {
  if (typeof window === "undefined") return;
  if (initStarted || posthog) return;

  const key = getPostHogKey();
  if (!key) {
    logAnalyticsDev("init:skipped", { reason: "no_key" });
    return;
  }

  initStarted = true;

  try {
    const { default: posthogJs } = await import("posthog-js");
    posthogJs.init(key, {
      api_host: getPostHogHost(),
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
    });
    posthog = posthogJs;
    logAnalyticsDev("init:success");
  } catch (error) {
    logAnalyticsDev("init:failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    initStarted = false;
  }
}

export function trackClientEvent(
  event: AnalyticsEventName,
  properties?: AnalyticsProperties,
): void {
  if (typeof window === "undefined") return;

  if (!isAnalyticsEnabled()) {
    logAnalyticsDev("track:skipped", { event, ...properties });
    return;
  }

  logAnalyticsDev("track", { event, ...properties });

  if (!posthog) {
    void initAnalytics().then(() => {
      posthog?.capture(event, properties);
    });
    return;
  }

  posthog.capture(event, properties);
}

export function identifyClientUser(
  userId: string,
  traits?: AnalyticsProperties,
): void {
  if (typeof window === "undefined") return;
  if (!isAnalyticsEnabled()) return;

  logAnalyticsDev("identify", { userId, ...traits });
  void initAnalytics().then(() => {
    posthog?.identify(userId, traits);
  });
}

export function trackClientPageView(path?: string): void {
  if (typeof window === "undefined") return;
  if (!isAnalyticsEnabled()) return;

  logAnalyticsDev("pageview", { path: path ?? window.location.pathname });

  void initAnalytics().then(() => {
    if (path) {
      posthog?.capture("$pageview", { $current_url: path });
    } else {
      posthog?.capture("$pageview");
    }
  });
}
