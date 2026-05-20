import { trackServerEvent, identifyServerUser } from "@/lib/analytics/server";

export { AnalyticsEvents } from "@/lib/analytics/events";
export type {
  AnalyticsEventName,
  AnalyticsProperties,
} from "@/lib/analytics/events";

export { trackServerEvent, identifyServerUser } from "@/lib/analytics/server";

export { logAnalyticsDev } from "@/lib/analytics/log";

/** Routes to server or client at runtime. Prefer explicit server/client imports in actions. */
export function trackEvent(
  event: Parameters<typeof trackServerEvent>[0],
  properties?: Parameters<typeof trackServerEvent>[1],
): void {
  if (typeof window === "undefined") {
    trackServerEvent(event, properties);
    return;
  }

  void import("@/lib/analytics/client").then((mod) => {
    mod.trackClientEvent(event, properties);
  });
}

/** Routes to server or client at runtime. */
export function identifyUser(
  userId: string,
  traits?: Parameters<typeof identifyServerUser>[1],
): void {
  if (typeof window === "undefined") {
    identifyServerUser(userId, traits);
    return;
  }

  void import("@/lib/analytics/client").then((mod) => {
    mod.identifyClientUser(userId, traits);
  });
}
