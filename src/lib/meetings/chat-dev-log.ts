import type { PostgrestError } from "@supabase/supabase-js";

export function logChatDev(
  step: string,
  details?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV !== "development") return;

  console.log(
    `[chat/dev] ${step}`,
    details ? JSON.stringify(details, null, 2) : "",
  );
}

export function logChatError(
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

  if (process.env.NODE_ENV === "production") return;
  console.error(`[chat/dev] ${step}`, payload);
}
