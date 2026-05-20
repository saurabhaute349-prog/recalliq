export function logAnalyticsDev(
  step: string,
  details?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "production") return;
  console.info(
    "[analytics/dev]",
    step,
    details ? JSON.stringify(details) : "",
  );
}
