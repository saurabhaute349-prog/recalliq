export function logIntelligenceDev(
  step: string,
  details?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "production") return;
  console.info("[intelligence/dev]", step, details ?? "");
}

export function logIntelligenceError(
  step: string,
  error: unknown,
  details?: Record<string, unknown>,
): void {
  console.error("[intelligence/dev]", step, details ?? "", error);
}
