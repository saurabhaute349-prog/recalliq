import { logMonitoringDev } from "@/lib/monitoring/log";

export function captureServerException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const message = error instanceof Error ? error.message : String(error);

  logMonitoringDev("server:capture", { message, ...context });

  if (process.env.NODE_ENV !== "production") {
    console.error("[monitoring/server]", message, context ?? "", error);
    return;
  }

  console.error("[monitoring/server]", message, context ?? "");
}

export function captureServerMessage(
  message: string,
  context?: Record<string, unknown>,
): void {
  logMonitoringDev("server:message", { message, ...context });

  if (process.env.NODE_ENV !== "production") {
    console.info("[monitoring/server]", message, context ?? "");
    return;
  }

  console.info("[monitoring/server]", message);
}
