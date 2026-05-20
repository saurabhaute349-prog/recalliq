export function logMonitoringDev(
  step: string,
  details?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "production") return;
  console.info(
    "[monitoring/dev]",
    step,
    details ? JSON.stringify(details) : "",
  );
}
