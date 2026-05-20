import { createClient } from "@/lib/supabase/server";
import {
  isSchemaMismatchError,
  logSupabaseError,
} from "@/lib/supabase/errors";
import { listRecentActionItems } from "@/lib/intelligence/queries";

export type DashboardStats = {
  totalMeetings: number;
  meetingsThisWeek: number;
  totalAiQuestions: number;
  topPeople: { name: string; count: number }[];
  recentActionItems: Awaited<ReturnType<typeof listRecentActionItems>>;
};

function startOfWeekIso(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const weekStart = startOfWeekIso();

  const [meetingsResult, weekResult, aiResult, intelligenceResult] =
    await Promise.all([
      supabase
        .from("meetings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("meetings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", weekStart),
      supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("role", "user"),
      supabase
        .from("meeting_intelligence")
        .select("people")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(20),
    ]);

  if (meetingsResult.error) {
    logSupabaseError("getDashboardStats/meetings", meetingsResult.error);
  }
  if (weekResult.error) {
    logSupabaseError("getDashboardStats/week", weekResult.error);
  }
  if (aiResult.error) {
    logSupabaseError("getDashboardStats/ai", aiResult.error);
  }

  const peopleCounts = new Map<string, number>();

  if (!intelligenceResult.error && intelligenceResult.data) {
    for (const row of intelligenceResult.data) {
      const people = (row.people ?? []) as string[];
      for (const name of people) {
        const key = name.trim();
        if (!key) continue;
        peopleCounts.set(key, (peopleCounts.get(key) ?? 0) + 1);
      }
    }
  } else if (
    intelligenceResult.error &&
    !isSchemaMismatchError(intelligenceResult.error)
  ) {
    logSupabaseError("getDashboardStats/people", intelligenceResult.error);
  }

  const topPeople = [...peopleCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentActionItems = await listRecentActionItems(userId, 5);

  return {
    totalMeetings: meetingsResult.count ?? 0,
    meetingsThisWeek: weekResult.count ?? 0,
    totalAiQuestions: aiResult.count ?? 0,
    topPeople,
    recentActionItems,
  };
}
