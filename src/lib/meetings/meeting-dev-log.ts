import type { PostgrestError } from "@supabase/supabase-js";

export function logMeetingDev(
  step: string,
  details?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV !== "development") return;

  console.log(
    `[meeting/dev] ${step}`,
    details ? JSON.stringify(details, null, 2) : "",
  );
}

export function logMeetingError(
  step: string,
  error: PostgrestError | Error | null | undefined,
  extra?: Record<string, unknown>,
): void {
  const payload: Record<string, unknown> = { ...extra };

  if (error && "code" in error) {
    payload.code = error.code;
    payload.message = error.message;
    payload.details = error.details;
    payload.hint = error.hint;
  } else if (error instanceof Error) {
    payload.message = error.message;
  }

  console.error(`[meeting/error] ${step}`, payload);
}

export function formatMeetingSaveError(
  error: PostgrestError | null | undefined,
  fallback: string,
): string {
  if (!error) return fallback;

  if (process.env.NODE_ENV === "development") {
    const parts = [error.message, error.details, error.hint].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" — ");
    }
  }

  if (error.code === "42501") {
    return "Permission denied saving this meeting. Sign out and sign in again.";
  }

  if (error.code === "23505") {
    return "This meeting already exists. Refresh and try again.";
  }

  if (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205"
  ) {
    return "Database schema is out of date. Run supabase/phase2-recovery.sql in Supabase.";
  }

  return fallback;
}
