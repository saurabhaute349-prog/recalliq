"use client";

import { logMonitoringDev } from "@/lib/monitoring/log";

let initialized = false;

function getDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN;
}

export function isMonitoringEnabled(): boolean {
  return Boolean(getDsn());
}

export async function initMonitoring(): Promise<void> {
  if (typeof window === "undefined") return;
  if (initialized) return;

  const dsn = getDsn();
  if (!dsn) {
    logMonitoringDev("init:skipped", { reason: "no_dsn" });
    return;
  }

  try {
    const Sentry = await import("@sentry/browser");
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    });
    initialized = true;
    logMonitoringDev("init:success");
  } catch (error) {
    logMonitoringDev("init:failed", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export function captureClientException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;

  logMonitoringDev("client:capture", {
    message: error instanceof Error ? error.message : String(error),
    ...context,
  });

  if (!isMonitoringEnabled()) return;

  void initMonitoring().then(async () => {
    if (!initialized) return;
    const Sentry = await import("@sentry/browser");
    Sentry.captureException(error, { extra: context });
  });
}

export function captureClientMessage(
  message: string,
  context?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;

  logMonitoringDev("client:message", { message, ...context });

  if (!isMonitoringEnabled()) return;

  void initMonitoring().then(async () => {
    if (!initialized) return;
    const Sentry = await import("@sentry/browser");
    Sentry.captureMessage(message);
  });
}
