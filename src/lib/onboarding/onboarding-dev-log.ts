export function logOnboardingDev(
  step: string,
  details?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "production") return;
  console.info(
    "[onboarding/dev]",
    step,
    details ? JSON.stringify(details) : "",
  );
}
