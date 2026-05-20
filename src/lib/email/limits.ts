import "server-only";

import { hasProAccess } from "@/lib/billing/plan";
import { sendLimitReachedEmail } from "@/lib/email/send";
import {
  FREE_PLAN_MEETING_LIMIT,
  FREE_PLAN_MESSAGE_LIMIT,
} from "@/lib/meetings/constants";
import type { Profile } from "@/types/database";

function displayName(profile: Pick<Profile, "full_name"> | null, fallback: string) {
  return profile?.full_name?.trim() || fallback;
}

export async function notifyMeetingLimitReached(input: {
  email: string;
  profile: Pick<Profile, "full_name" | "plan_type" | "subscription_status" | "current_period_end"> | null;
  meetingsUsed: number;
}): Promise<void> {
  if (hasProAccess(input.profile)) {
    return;
  }

  if (input.meetingsUsed !== FREE_PLAN_MEETING_LIMIT) {
    return;
  }

  await sendLimitReachedEmail({
    to: input.email,
    name: displayName(input.profile, "there"),
    kind: "meetings",
  });
}

export async function notifyAiQuestionLimitReached(input: {
  email: string;
  profile: Pick<Profile, "full_name" | "plan_type" | "subscription_status" | "current_period_end"> | null;
  userMessageCount: number;
}): Promise<void> {
  if (hasProAccess(input.profile)) {
    return;
  }

  if (input.userMessageCount !== FREE_PLAN_MESSAGE_LIMIT) {
    return;
  }

  await sendLimitReachedEmail({
    to: input.email,
    name: displayName(input.profile, "there"),
    kind: "ai_questions",
  });
}
