export function logAiDev(
  step: string,
  details?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "production") return;
  console.info("[ai/dev]", step, details ?? "");
}

export function logAiError(
  step: string,
  error: unknown,
  details?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "production") return;
  console.error("[ai/dev]", step, details ?? "", error);
}
