import { logAnalyticsDev } from "@/lib/analytics/log";
import type {
  AnalyticsEventName,
  AnalyticsProperties,
} from "@/lib/analytics/events";

export function trackServerEvent(
  event: AnalyticsEventName,
  properties?: AnalyticsProperties,
): void {
  logAnalyticsDev("server:track", { event, ...properties });

  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics/server]", event, properties ?? "");
    return;
  }

  console.info("[analytics/server]", event);
}

export function identifyServerUser(
  userId: string,
  traits?: AnalyticsProperties,
): void {
  logAnalyticsDev("server:identify", { userId, ...traits });

  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics/server] identify", userId, traits ?? "");
  }
}
