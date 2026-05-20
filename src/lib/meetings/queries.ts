import { createClient } from "@/lib/supabase/server";
import {
  isMissingColumnError,
  logSupabaseError,
  logSupabaseSchemaFallback,
} from "@/lib/supabase/errors";
import {
  fetchProfileByUserId,
  insertProfileRow,
} from "@/lib/supabase/profile-repository";
import type {
  ChatMessage,
  MeetingDetail,
  MeetingListItem,
  Profile,
} from "@/types/database";

const MEETING_LIST_COLUMNS_FULL =
  "id, title, summary, participant_count, message_count, created_at, category, archived, pinned, favorite, is_demo";

const MEETING_LIST_COLUMNS_BASE =
  "id, title, summary, participant_count, message_count, created_at";

type MeetingListRow = Record<string, unknown>;

function normalizeMeetingListItem(row: MeetingListRow): MeetingListItem {
  return {
    id: String(row.id),
    title: String(row.title ?? "Untitled meeting"),
    summary: (row.summary as string | null) ?? null,
    participant_count: Number(row.participant_count ?? 0),
    message_count: Number(row.message_count ?? 0),
    created_at: String(row.created_at),
    category: (row.category as string | null) ?? null,
    archived: Boolean(row.archived ?? false),
    pinned: Boolean(row.pinned ?? false),
    favorite: Boolean(row.favorite ?? false),
    is_demo: Boolean(row.is_demo ?? false),
  };
}

const CHAT_MESSAGE_COLUMNS =
  "id, meeting_id, user_id, role, content, created_at" as const;

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

export async function getUserProfile(): Promise<Profile | null> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const profile = await fetchProfileByUserId(supabase, user.id, "getUserProfile");

  if (profile) {
    return profile;
  }

  return ensureUserProfile(
    supabase,
    user.id,
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
  );
}

export async function ensureUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  fullName: string | null,
): Promise<Profile | null> {
  const inserted = await insertProfileRow(
    supabase,
    {
      id: userId,
      full_name: fullName ?? "",
      meetings_used: 0,
      planType: "free",
    },
    "ensureUserProfile",
  );

  if (inserted) {
    return inserted;
  }

  return fetchProfileByUserId(supabase, userId, "ensureUserProfile/retry");
}

export async function listMeetings(options?: {
  includeArchived?: boolean;
}): Promise<MeetingListItem[]> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return [];

  const variants: { columns: string; withOrg: boolean }[] = [
    { columns: MEETING_LIST_COLUMNS_FULL, withOrg: true },
    { columns: MEETING_LIST_COLUMNS_BASE, withOrg: false },
  ];

  let lastError: Parameters<typeof logSupabaseError>[1] = null;

  for (let i = 0; i < variants.length; i++) {
    const { columns, withOrg } = variants[i];

    let query = supabase.from("meetings").select(columns).eq("user_id", user.id);

    if (withOrg && !options?.includeArchived) {
      query = query.eq("archived", false);
    }

    const ordered = withOrg
      ? query.order("pinned", { ascending: false }).order("created_at", {
          ascending: false,
        })
      : query.order("created_at", { ascending: false });

    const { data, error } = await ordered;

    if (!error) {
      if (i > 0) {
        logSupabaseSchemaFallback("listMeetings");
      }
      return (data ?? []).map((row) =>
        normalizeMeetingListItem(row as unknown as MeetingListRow),
      );
    }

    lastError = error;

    if (isMissingColumnError(error) && i < variants.length - 1) {
      continue;
    }

    break;
  }

  logSupabaseError("listMeetings", lastError);
  return [];
}

export async function getMeetingById(
  meetingId: string,
): Promise<MeetingDetail | null> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    logSupabaseError("getMeetingById", error);
    return null;
  }

  return data as MeetingDetail | null;
}

export async function listChatMessages(
  meetingId: string,
): Promise<ChatMessage[]> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("chat_messages")
    .select(CHAT_MESSAGE_COLUMNS)
    .eq("meeting_id", meetingId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    logSupabaseError("listChatMessages", error);
    return [];
  }

  return (data ?? []) as ChatMessage[];
}
