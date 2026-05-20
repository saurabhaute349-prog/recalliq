import type { PostgrestError } from "@supabase/supabase-js";

export function isMissingColumnError(error: PostgrestError | null): boolean {
  return error?.code === "42703" || error?.code === "PGRST204";
}

/** Table missing from schema cache or database (e.g. meeting_intelligence not migrated). */
export function isMissingTableError(error: PostgrestError | null): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /could not find the table/i.test(error.message ?? "")
  );
}

export function isSchemaMismatchError(error: PostgrestError | null): boolean {
  return isMissingColumnError(error) || isMissingTableError(error);
}

export function logSupabaseError(context: string, error: PostgrestError | null) {
  if (!error) return;

  console.error(
    `[supabase/${context}]`,
    error.code,
    error.message,
    error.details ?? "",
  );

  if (isSchemaMismatchError(error)) {
    console.error(
      `[supabase/${context}] Database schema is behind the app. Run in Supabase → SQL Editor:`,
    );
    console.error("  supabase/phase2-recovery.sql  (recommended — one file)");
    console.error("  Then: Project Settings → API → Reload schema (or wait ~1 minute).");
  }
}

/** Dev-only hint when a query intentionally falls back to fewer columns. */
export function logSupabaseSchemaFallback(context: string): void {
  if (process.env.NODE_ENV === "production") return;
  console.info(
    `[supabase/${context}] Using legacy column set — run supabase/phase2-recovery.sql for full features.`,
  );
}
