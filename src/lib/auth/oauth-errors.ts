import { getAuthErrorMessage } from "@/lib/auth/errors";

export function getOAuthErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("access_denied") ||
    normalized.includes("user cancelled") ||
    normalized.includes("popup closed")
  ) {
    return "Google sign-in was cancelled.";
  }

  if (normalized.includes("provider is not enabled")) {
    return "Google sign-in is not available right now. Please try email instead.";
  }

  return getAuthErrorMessage(message);
}
