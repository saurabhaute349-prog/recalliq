import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ExtractedIntelligence } from "@/lib/intelligence/extract";
import {
  logIntelligenceDev,
  logIntelligenceError,
} from "@/lib/intelligence/intelligence-dev-log";
import { isSchemaMismatchError } from "@/lib/supabase/errors";
import type { MeetingIntelligence } from "@/types/database";

export async function persistMeetingIntelligence(
  supabase: SupabaseClient,
  input: {
    meetingId: string;
    userId: string;
    data: ExtractedIntelligence;
  },
): Promise<MeetingIntelligence | null> {
  const id = randomUUID();
  const now = new Date().toISOString();

  const payload = {
    id,
    meeting_id: input.meetingId,
    user_id: input.userId,
    people: input.data.people,
    companies: input.data.companies,
    action_items: input.data.action_items,
    blockers: input.data.blockers,
    deadlines: input.data.deadlines,
    decisions: input.data.decisions,
    risks: input.data.risks,
    product_names: input.data.product_names,
    priorities: input.data.priorities,
    summary: input.data.summary,
    suggested_questions: input.data.suggested_questions,
    meeting_type: input.data.meeting_type,
    updated_at: now,
  };

  logIntelligenceDev("persist:start", {
    meetingId: input.meetingId,
    intelligenceId: id,
  });

  const { error: insertError } = await supabase
    .from("meeting_intelligence")
    .insert({ ...payload, created_at: now });

  if (insertError) {
    if (insertError.code === "23505") {
      const { error: updateError } = await supabase
        .from("meeting_intelligence")
        .update(payload)
        .eq("meeting_id", input.meetingId)
        .eq("user_id", input.userId);

      if (updateError) {
        logIntelligenceError("persist:update-failed", updateError, {
          meetingId: input.meetingId,
          missingTable: isSchemaMismatchError(updateError),
        });
        return null;
      }

      logIntelligenceDev("persist:updated", { meetingId: input.meetingId });
      return { ...payload, created_at: now } as MeetingIntelligence;
    }

    logIntelligenceError("persist:insert-failed", insertError, {
      meetingId: input.meetingId,
      missingTable: isSchemaMismatchError(insertError),
    });
    return null;
  }

  logIntelligenceDev("persist:success", { meetingId: input.meetingId });
  return { ...payload, created_at: now } as MeetingIntelligence;
}
