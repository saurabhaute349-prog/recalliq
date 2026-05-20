import "server-only";

import { randomUUID } from "node:crypto";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import {
  formatMeetingSaveError,
  logMeetingDev,
  logMeetingError,
} from "@/lib/meetings/meeting-dev-log";
import { isMissingColumnError } from "@/lib/supabase/errors";
import type { MeetingCreateMetadata } from "@/types/database";

export type PersistMeetingInput = {
  userId: string;
  title: string;
  transcript: string;
  summary: string;
  participantCount: number;
  metadata?: MeetingCreateMetadata & {
    transcriptRaw?: string | null;
  };
};

export type PersistMeetingResult =
  | { ok: true; meetingId: string }
  | { ok: false; error: string };

const INSERT_MAX_ATTEMPTS = 2;
const VERIFY_MAX_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNonRetryableInsertError(error: PostgrestError): boolean {
  const code = error.code ?? "";
  return (
    code === "23505" ||
    code === "23503" ||
    code === "42501" ||
    code === "42703" ||
    code === "PGRST204" ||
    code === "PGRST205"
  );
}

/**
 * Inserts a meeting using a client-generated id so we do not rely on
 * INSERT … RETURNING (which requires SELECT RLS to pass).
 */
export async function persistMeeting(
  supabase: SupabaseClient,
  input: PersistMeetingInput,
): Promise<PersistMeetingResult> {
  const meetingId = randomUUID();

  const corePayload = {
    id: meetingId,
    user_id: input.userId,
    title: input.title.slice(0, 500) || "Meeting Memory",
    transcript: input.transcript,
    summary: input.summary,
    participant_count: Math.max(0, input.participantCount),
    message_count: 0,
  };

  logMeetingDev("insert:core:start", {
    meetingId,
    userId: input.userId,
    title: corePayload.title,
    transcriptLength: input.transcript.length,
    summaryLength: input.summary.length,
    participantCount: corePayload.participant_count,
    payloadKeys: Object.keys(corePayload),
  });

  let insertError: PostgrestError | null = null;

  for (let attempt = 1; attempt <= INSERT_MAX_ATTEMPTS; attempt++) {
    const result = await supabase.from("meetings").insert(corePayload);
    insertError = result.error;

    if (!insertError) break;

    logMeetingError("insert:core:failed", insertError, {
      meetingId,
      userId: input.userId,
      attempt,
    });

    if (
      attempt >= INSERT_MAX_ATTEMPTS ||
      isNonRetryableInsertError(insertError)
    ) {
      break;
    }

    logMeetingDev("insert:core:retry", { meetingId, attempt });
    await sleep(250 * attempt);
  }

  if (insertError) {
    return {
      ok: false,
      error: formatMeetingSaveError(
        insertError,
        "Could not save this meeting. Please try again.",
      ),
    };
  }

  logMeetingDev("insert:core:success", { meetingId });

  let verified = false;

  for (let attempt = 1; attempt <= VERIFY_MAX_ATTEMPTS; attempt++) {
    const { data: verifyRow, error: verifyError } = await supabase
      .from("meetings")
      .select("id")
      .eq("id", meetingId)
      .eq("user_id", input.userId)
      .maybeSingle();

    if (verifyError) {
      logMeetingError("insert:verify-read-failed", verifyError, {
        meetingId,
        attempt,
      });
    } else if (verifyRow) {
      verified = true;
      logMeetingDev("insert:verify:success", { meetingId, attempt });
      break;
    } else {
      logMeetingDev("insert:verify:missing", { meetingId, attempt });
    }

    if (attempt < VERIFY_MAX_ATTEMPTS) {
      await sleep(200 * attempt);
    }
  }

  if (!verified) {
    logMeetingError("insert:verify-exhausted", null, { meetingId });
    return {
      ok: false,
      error:
        "Meeting could not be confirmed after save. Check RLS policies (run supabase/phase2-recovery.sql) and try again.",
    };
  }

  const meta = input.metadata;
  if (meta) {
    const metadataPayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (meta.originalFilename != null) {
      metadataPayload.original_filename = meta.originalFilename;
    }
    if (meta.uploadType != null) {
      metadataPayload.upload_type = meta.uploadType;
    }
    if (meta.transcriptRaw != null) {
      metadataPayload.transcript_raw = meta.transcriptRaw;
    }
    if (meta.durationSeconds != null) {
      metadataPayload.duration_seconds = meta.durationSeconds;
    }
    metadataPayload.uploaded_at = new Date().toISOString();

    if (Object.keys(metadataPayload).length > 1) {
      const { error: metaError } = await supabase
        .from("meetings")
        .update(metadataPayload)
        .eq("id", meetingId)
        .eq("user_id", input.userId);

      if (metaError) {
        logMeetingError("insert:metadata:failed", metaError, {
          meetingId,
          skipped: isMissingColumnError(metaError),
        });
      } else {
        logMeetingDev("insert:metadata:success", { meetingId });
      }
    }
  }

  return { ok: true, meetingId };
}

export async function incrementMeetingsUsed(
  supabase: SupabaseClient,
  userId: string,
  nextCount: number,
): Promise<{ ok: boolean; error?: string }> {
  logMeetingDev("profile:increment", { userId, nextCount });

  const { error } = await supabase
    .from("profiles")
    .update({
      meetings_used: nextCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    logMeetingError("profile:increment:failed", error, { userId, nextCount });

    if (isMissingColumnError(error)) {
      logMeetingDev("profile:increment:skipped-missing-column");
      return { ok: true };
    }

    return {
      ok: false,
      error: formatMeetingSaveError(
        error,
        "Could not update your usage count. The meeting was saved.",
      ),
    };
  }

  return { ok: true };
}

/**
 * Atomically bumps meetings_used for free users (row must still be under limit).
 * Pro users always increment.
 */
export async function incrementMeetingsUsedIfAllowed(
  supabase: SupabaseClient,
  userId: string,
  isPro: boolean,
  meetingLimit: number,
): Promise<{ ok: boolean; blocked?: boolean; newCount?: number; error?: string }> {
  logMeetingDev("profile:increment-atomic:start", {
    userId,
    isPro,
    meetingLimit,
  });

  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("meetings_used")
    .eq("id", userId)
    .maybeSingle();

  if (readError) {
    logMeetingError("profile:increment-atomic:read-failed", readError, {
      userId,
    });
    if (isMissingColumnError(readError)) {
      return { ok: true };
    }
    return {
      ok: false,
      error: formatMeetingSaveError(
        readError,
        "Could not verify your usage limit.",
      ),
    };
  }

  const currentUsed = profile?.meetings_used ?? 0;

  if (!isPro && currentUsed >= meetingLimit) {
    logMeetingDev("profile:increment-atomic:blocked", {
      userId,
      currentUsed,
      meetingLimit,
    });
    return { ok: false, blocked: true };
  }

  const nextCount = currentUsed + 1;

  let updateQuery = supabase
    .from("profiles")
    .update({
      meetings_used: nextCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (!isPro) {
    updateQuery = updateQuery.lt("meetings_used", meetingLimit);
  }

  const { data: updated, error: updateError } = await updateQuery
    .select("meetings_used")
    .maybeSingle();

  if (updateError) {
    logMeetingError("profile:increment-atomic:failed", updateError, {
      userId,
      nextCount,
    });

    if (isMissingColumnError(updateError)) {
      return { ok: true, newCount: nextCount };
    }

    return {
      ok: false,
      error: formatMeetingSaveError(
        updateError,
        "Could not update your usage count.",
      ),
    };
  }

  if (!updated) {
    logMeetingDev("profile:increment-atomic:race-blocked", { userId });
    return { ok: false, blocked: true };
  }

  logMeetingDev("profile:increment-atomic:success", {
    userId,
    newCount: updated.meetings_used,
  });

  return { ok: true, newCount: updated.meetings_used as number };
}

export async function decrementMeetingsUsed(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("meetings_used")
    .eq("id", userId)
    .maybeSingle();

  const current = profile?.meetings_used ?? 0;
  if (current <= 0) return;

  await supabase
    .from("profiles")
    .update({
      meetings_used: Math.max(0, current - 1),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
