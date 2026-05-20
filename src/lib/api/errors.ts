import type { PostgrestError } from "@supabase/supabase-js";

export function formatSupabaseError(
  error: PostgrestError | null | undefined,
  fallback: string,
): string {
  if (!error) return fallback;

  if (process.env.NODE_ENV === "development") {
    return [error.message, error.details, error.hint].filter(Boolean).join(" — ");
  }

  if (error.code === "42501") {
    return "Permission denied. Please sign in again.";
  }

  if (error.code === "42703" || error.code === "PGRST204") {
    return "Database schema is out of date. Contact support or run migrations.";
  }

  return fallback;
}

export function isNextRedirectError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "digest" in error &&
    String((error as { digest?: string }).digest ?? "").startsWith(
      "NEXT_REDIRECT",
    )
  );
}
