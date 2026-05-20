import "server-only";

export type EmailKind =
  | "welcome"
  | "limit-reached"
  | "upgrade-success"
  | "renewal-success"
  | "payment-failed"
  | "subscription-cancelled";

export function logEmailSkipped(kind: EmailKind, reason: string) {
  console.info(`[email/${kind}] skipped: ${reason}`);
}

export function logEmailSent(kind: EmailKind, to: string) {
  const domain = to.includes("@") ? to.split("@")[1] : "unknown";
  console.info(`[email/${kind}] sent to *@${domain}`);
}

export function logEmailError(kind: EmailKind, error: unknown) {
  const message =
    error instanceof Error ? error.message : "Unknown email error";
  console.error(`[email/${kind}] failed: ${message}`);
}
