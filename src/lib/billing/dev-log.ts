export function logBillingDev(
  step: string,
  details?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV !== "development") return;

  console.log(
    `[billing/dev] ${step}`,
    details ? JSON.stringify(details, null, 2) : "",
  );
}
