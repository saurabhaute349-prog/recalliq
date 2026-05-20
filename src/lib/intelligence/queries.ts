import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import {
  isSchemaMismatchError,
  logSupabaseError,
} from "@/lib/supabase/errors";
import type { MeetingIntelligence } from "@/types/database";

const INTELLIGENCE_COLUMNS =
  "id, meeting_id, user_id, people, companies, action_items, blockers, deadlines, decisions, risks, product_names, priorities, summary, suggested_questions, meeting_type, created_at, updated_at" as const;

export async function getMeetingIntelligenceWithClient(
  supabase: SupabaseClient,
  meetingId: string,
  userId: string,
): Promise<MeetingIntelligence | null> {
  const { data, error } = await supabase
    .from("meeting_intelligence")
    .select(INTELLIGENCE_COLUMNS)
    .eq("meeting_id", meetingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isSchemaMismatchError(error)) return null;
    logSupabaseError("getMeetingIntelligence", error);
    return null;
  }

  return data as MeetingIntelligence | null;
}

export async function getMeetingIntelligence(
  meetingId: string,
  userId: string,
): Promise<MeetingIntelligence | null> {
  const supabase = await createClient();
  return getMeetingIntelligenceWithClient(supabase, meetingId, userId);
}

export async function listRecentActionItems(
  userId: string,
  limit = 6,
): Promise<{ meetingId: string; meetingTitle: string; task: string; owner: string | null }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("meeting_intelligence")
    .select("meeting_id, action_items, meetings(title)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(12);

  if (error) {
    if (isSchemaMismatchError(error)) return [];
    logSupabaseError("listRecentActionItems", error);
    return [];
  }

  const results: {
    meetingId: string;
    meetingTitle: string;
    task: string;
    owner: string | null;
  }[] = [];

  for (const row of data ?? []) {
    const meeting = row.meetings as { title?: string } | null;
    const title = meeting?.title ?? "Meeting";
    const items = (row.action_items ?? []) as {
      task: string;
      owner: string | null;
    }[];

    for (const item of items) {
      if (!item.task) continue;
      results.push({
        meetingId: row.meeting_id as string,
        meetingTitle: title,
        task: item.task,
        owner: item.owner,
      });
      if (results.length >= limit) return results;
    }
  }

  return results;
}
