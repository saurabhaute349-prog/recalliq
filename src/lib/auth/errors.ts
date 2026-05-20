export function getAuthErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password")
  ) {
    return "Incorrect email or password. Please try again.";
  }

  if (normalized.includes("user already registered")) {
    return "An account with this email already exists. Try signing in.";
  }

  if (normalized.includes("password")) {
    return "Password must be at least 8 characters.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  if (normalized.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return message;
}
