import type { SupabaseClient } from "@supabase/supabase-js";

import { logSearchDev, logSearchError } from "@/lib/meetings/search-dev-log";
import { isSchemaMismatchError } from "@/lib/supabase/errors";
import type { MeetingListItem } from "@/types/database";

export type MeetingSearchHit = MeetingListItem & {
  snippet: string;
  rank: number;
};

const LIST_COLUMNS =
  "id, title, summary, participant_count, message_count, created_at" as const;

function escapeIlike(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&");
}

function buildSnippet(
  query: string,
  meeting: Pick<MeetingListItem, "title" | "summary"> & {
    transcript?: string;
  },
): string {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);

  const sources = [
    meeting.summary ?? "",
    meeting.title,
    meeting.transcript?.slice(0, 2000) ?? "",
  ].filter(Boolean);

  for (const source of sources) {
    const lower = source.toLowerCase();
    for (const term of terms) {
      const index = lower.indexOf(term);
      if (index >= 0) {
        const start = Math.max(0, index - 60);
        const end = Math.min(source.length, index + term.length + 80);
        const slice = source.slice(start, end).trim();
        const prefix = start > 0 ? "…" : "";
        const suffix = end < source.length ? "…" : "";
        return `${prefix}${slice}${suffix}`;
      }
    }
  }

  return meeting.summary?.slice(0, 160) ?? meeting.title;
}

function highlightSnippet(snippet: string, query: string): string {
  const terms = query
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .slice(0, 5);

  let result = snippet;
  for (const term of terms) {
    const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    result = result.replace(re, "**$1**");
  }
  return result;
}

export async function searchMeetings(
  supabase: SupabaseClient,
  userId: string,
  rawQuery: string,
  limit = 24,
): Promise<MeetingSearchHit[]> {
  const query = rawQuery.trim();
  if (!query) return [];

  logSearchDev("search:start", { userId, queryLength: query.length });

  const ftsResult = await searchWithFullText(supabase, userId, query, limit);
  if (ftsResult !== null) {
    logSearchDev("search:fts-complete", { count: ftsResult.length });
    return ftsResult;
  }

  const fallback = await searchWithIlike(supabase, userId, query, limit);
  logSearchDev("search:fallback-complete", { count: fallback.length });
  return fallback;
}

async function searchWithFullText(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  limit: number,
): Promise<MeetingSearchHit[] | null> {
  const { data, error } = await supabase
    .from("meetings")
    .select(`${LIST_COLUMNS}, transcript`)
    .eq("user_id", userId)
    .textSearch("search_vector", query, {
      type: "websearch",
      config: "english",
    })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isSchemaMismatchError(error)) {
      logSearchDev("search:fts-unavailable", { reason: "missing search_vector" });
      return null;
    }
    logSearchError("search:fts-failed", error);
    return null;
  }

  return (data ?? []).map((row, index) => {
    const meeting = row as MeetingListItem & { transcript?: string };
    const snippet = buildSnippet(query, meeting);
    return {
      ...meeting,
      snippet: highlightSnippet(snippet, query),
      rank: (data?.length ?? 0) - index,
    };
  });
}

async function searchWithIlike(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  limit: number,
): Promise<MeetingSearchHit[]> {
  const pattern = `%${escapeIlike(query)}%`;

  const { data, error } = await supabase
    .from("meetings")
    .select(`${LIST_COLUMNS}, transcript`)
    .eq("user_id", userId)
    .or(
      `title.ilike.${pattern},summary.ilike.${pattern},transcript.ilike.${pattern}`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logSearchError("search:ilike-failed", error);
    return [];
  }

  return (data ?? []).map((row, index) => {
    const meeting = row as MeetingListItem & { transcript?: string };
    const snippet = buildSnippet(query, meeting);
    return {
      ...meeting,
      snippet: highlightSnippet(snippet, query),
      rank: (data?.length ?? 0) - index,
    };
  });
}
