export function logCommandDev(
  step: string,
  details?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "production") return;
  console.info("[command/dev]", step, details ?? "");
}
