import type { SupabaseClient } from "@supabase/supabase-js";

import { extractMeetingIntelligence } from "@/lib/intelligence/extract";
import {
  logIntelligenceDev,
  logIntelligenceError,
} from "@/lib/intelligence/intelligence-dev-log";
import { persistMeetingIntelligence } from "@/lib/intelligence/persist";
import type { MeetingIntelligence } from "@/types/database";

export async function analyzeMeetingIntelligence(
  supabase: SupabaseClient,
  userId: string,
  meetingId: string,
  transcript: string,
): Promise<MeetingIntelligence | null> {
  try {
    logIntelligenceDev("analyze:start", { meetingId, userId });

    const data = await extractMeetingIntelligence(transcript);
    const saved = await persistMeetingIntelligence(supabase, {
      meetingId,
      userId,
      data,
    });

    return saved;
  } catch (error) {
    logIntelligenceError("analyze:failed", error, { meetingId });
    return null;
  }
}
