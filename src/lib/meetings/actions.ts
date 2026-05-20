"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isNextRedirectError } from "@/lib/api/errors";
import { generateMeetingReply, generateMeetingSummary } from "@/lib/ai/gemini";
import { analyzeMeetingIntelligence } from "@/lib/intelligence/analyze-meeting";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { trackServerEvent } from "@/lib/analytics/server";
import { BRAND } from "@/lib/brand/config";
import { markOnboardingStep } from "@/lib/onboarding/actions";
import { captureServerException } from "@/lib/monitoring/server";
import { getMeetingIntelligenceWithClient } from "@/lib/intelligence/queries";
import { preprocessPastedTranscript } from "@/lib/transcripts/extract";
import type { MeetingCreateMetadata } from "@/types/database";
import {
  countUserMessages,
  loadMeetingChatContext,
  persistChatExchange,
} from "@/lib/meetings/chat-service";
import { hasProAccess } from "@/lib/billing/plan";
import {
  notifyAiQuestionLimitReached,
  notifyMeetingLimitReached,
} from "@/lib/email/limits";
import {
  FREE_PLAN_MEETING_LIMIT,
  MIN_TRANSCRIPT_LENGTH,
} from "@/lib/meetings/constants";
import { getAuthenticatedUser, getUserProfile } from "@/lib/meetings/queries";
import {
  buildSummaryPreview,
  countParticipants,
} from "@/lib/meetings/transcript-utils";
import {
  logMeetingDev,
  logMeetingError,
} from "@/lib/meetings/meeting-dev-log";
import {
  incrementMeetingsUsedIfAllowed,
  persistMeeting,
} from "@/lib/meetings/persist-meeting";
import { generateTitleFromTranscript } from "@/lib/meetings/title";

export type MeetingActionResult = {
  error?: string;
  limitReached?: boolean;
  meetingId?: string;
};

export async function createMeeting(
  transcript: string,
  metadata?: MeetingCreateMetadata,
): Promise<MeetingActionResult> {
  try {
  let cleaned = transcript.trim();
  let raw = metadata?.transcriptRaw?.trim() ?? cleaned;
  let title = generateTitleFromTranscript(cleaned);
  let participantCount = countParticipants(cleaned);
  let durationSeconds = metadata?.durationSeconds ?? null;
  let uploadType = metadata?.uploadType ?? "paste";
  let originalFilename = metadata?.originalFilename ?? null;

  if (metadata?.title) {
    title = metadata.title;
  }

  if (metadata?.participantCount != null) {
    participantCount = metadata.participantCount;
  }

  if (!metadata?.transcriptRaw) {
    try {
      const preprocessed = preprocessPastedTranscript(cleaned);
      cleaned = preprocessed.cleaned;
      raw = preprocessed.raw;
      title = preprocessed.title;
      participantCount = preprocessed.participantCount;
      durationSeconds = preprocessed.durationSeconds;
      uploadType = preprocessed.uploadType;
      originalFilename = preprocessed.originalFilename;
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : `Please paste a longer transcript so ${BRAND.name} can build memory.`,
      };
    }
  }

  if (cleaned.length < MIN_TRANSCRIPT_LENGTH) {
    return {
      error: `Please paste a longer transcript so ${BRAND.name} can build memory.`,
    };
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { error: "You must be signed in to create a meeting." };
  }

  logMeetingDev("create:start", {
    userId: user.id,
    email: user.email,
    transcriptLength: cleaned.length,
    title,
    uploadType,
  });

  const profile = await getUserProfile();

  if (!profile) {
    return { error: "Could not verify your plan. Please try again." };
  }

  const meetingsUsed = profile.meetings_used ?? 0;
  const isPro = hasProAccess(profile);

  if (!isPro && meetingsUsed >= FREE_PLAN_MEETING_LIMIT) {
    return {
      limitReached: true,
      error: `Free plan includes ${FREE_PLAN_MEETING_LIMIT} meetings. Upgrade to add more memory.`,
    };
  }

  let summary = buildSummaryPreview(cleaned);

  try {
    const aiSummary = await generateMeetingSummary(cleaned);
    if (aiSummary) summary = aiSummary;
  } catch (error) {
    logMeetingError("create:summary-failed", error as Error);
  }

  const persistResult = await persistMeeting(supabase, {
    userId: user.id,
    title,
    transcript: cleaned,
    summary,
    participantCount,
    metadata: {
      title,
      originalFilename,
      uploadType,
      transcriptRaw: raw,
      durationSeconds,
      participantCount,
    },
  });

  if (!persistResult.ok) {
    return { error: persistResult.error };
  }

  const meetingId = persistResult.meetingId;

  const usageResult = await incrementMeetingsUsedIfAllowed(
    supabase,
    user.id,
    isPro,
    FREE_PLAN_MEETING_LIMIT,
  );

  if (!usageResult.ok) {
    if (usageResult.blocked) {
      await supabase
        .from("meetings")
        .delete()
        .eq("id", meetingId)
        .eq("user_id", user.id);

      return {
        limitReached: true,
        error: `Free plan includes ${FREE_PLAN_MEETING_LIMIT} meetings. Upgrade to add more memory.`,
      };
    }

    logMeetingDev("create:usage-warning", {
      meetingId,
      error: usageResult.error,
    });
  }

  const nextMeetingsUsed = usageResult.newCount ?? meetingsUsed + 1;

  if (user.email) {
    await notifyMeetingLimitReached({
      email: user.email,
      profile,
      meetingsUsed: nextMeetingsUsed,
    });
  }

  await markOnboardingStep("uploadTranscript");

  try {
    await analyzeMeetingIntelligence(supabase, user.id, meetingId, cleaned);
  } catch (error) {
    logMeetingError("create:intelligence-failed", error as Error, { meetingId });
  }

  revalidatePath("/dashboard");
  revalidatePath("/meetings");
  revalidatePath("/new");
  revalidatePath(`/meetings/${meetingId}`);

  trackServerEvent(AnalyticsEvents.createMeeting, {
    meetingId,
    uploadType: uploadType ?? "paste",
  });

  logMeetingDev("create:redirect", { meetingId });

  redirect(`/meetings/${meetingId}`);
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    captureServerException(error, { context: "createMeeting" });
    logMeetingError("create:unexpected", error as Error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not save this meeting. Please try again.",
    };
  }
}

export async function sendMeetingMessage(input: {
  meetingId: string;
  content: string;
}): Promise<MeetingActionResult> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const loaded = await loadMeetingChatContext(
    supabase,
    user.id,
    input.meetingId,
    input.content,
  );

  if (loaded.error) {
    return {
      error: loaded.error.error,
      limitReached: loaded.error.limitReached,
    };
  }

  const { meeting, priorMessages, trimmed } = loaded.context!;

  const intelligence = await getMeetingIntelligenceWithClient(
    supabase,
    meeting.id,
    user.id,
  );

  let assistantContent: string;

  try {
    assistantContent = await generateMeetingReply({
      transcript: meeting.transcript,
      priorMessages,
      question: trimmed,
      intelligence,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "I could not generate a response right now. Please try again.",
    };
  }

  const persisted = await persistChatExchange(
    supabase,
    user.id,
    meeting.id,
    trimmed,
    assistantContent,
  );

  if (persisted.error) {
    return { error: persisted.error };
  }

  const profile = await getUserProfile();
  const userMessageCount = countUserMessages(priorMessages) + 1;

  if (user.email) {
    await notifyAiQuestionLimitReached({
      email: user.email,
      profile,
      userMessageCount,
    });
  }

  revalidatePath(`/meetings/${meeting.id}`);
  revalidatePath("/meetings");
  revalidatePath("/dashboard");

  return { meetingId: meeting.id };
}

export async function deleteMeeting(
  meetingId: string,
): Promise<MeetingActionResult> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  logMeetingDev("delete:start", { meetingId, userId: user.id });

  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", meetingId)
    .eq("user_id", user.id);

  if (error) {
    logMeetingError("delete:failed", error, { meetingId });
    return { error: "Could not delete this meeting. Please try again." };
  }

  revalidatePath("/meetings");
  revalidatePath("/dashboard");
  revalidatePath("/search");

  logMeetingDev("delete:success", { meetingId });

  return { meetingId };
}

export async function renameMeeting(
  meetingId: string,
  title: string,
): Promise<MeetingActionResult> {
  const trimmed = title.trim().slice(0, 500);

  if (!trimmed) {
    return { error: "Enter a title for this meeting." };
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  logMeetingDev("rename:start", { meetingId, title: trimmed });

  const { error } = await supabase
    .from("meetings")
    .update({
      title: trimmed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", meetingId)
    .eq("user_id", user.id);

  if (error) {
    logMeetingError("rename:failed", error, { meetingId });
    return { error: "Could not rename this meeting. Please try again." };
  }

  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath("/meetings");
  revalidatePath("/search");

  logMeetingDev("rename:success", { meetingId });

  return { meetingId };
}
