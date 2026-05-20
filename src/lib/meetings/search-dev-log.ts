export function logSearchDev(
  step: string,
  details?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "production") return;
  console.info("[search/dev]", step, details ?? "");
}

export function logSearchError(
  step: string,
  error: unknown,
  details?: Record<string, unknown>,
): void {
  console.error("[search/dev]", step, details ?? "", error);
}
