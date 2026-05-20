import {
  captureServerException,
  captureServerMessage,
} from "@/lib/monitoring/server";

export {
  captureServerException,
  captureServerMessage,
} from "@/lib/monitoring/server";

export { logMonitoringDev } from "@/lib/monitoring/log";

/** Routes to server or client at runtime. Prefer explicit server/client imports in actions. */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") {
    captureServerException(error, context);
    return;
  }

  void import("@/lib/monitoring/client").then((mod) => {
    mod.captureClientException(error, context);
  });
}

/** Routes to server or client at runtime. Prefer explicit server/client imports in actions. */
export function captureMessage(
  message: string,
  context?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") {
    captureServerMessage(message, context);
    return;
  }

  void import("@/lib/monitoring/client").then((mod) => {
    mod.captureClientMessage(message, context);
  });
}
