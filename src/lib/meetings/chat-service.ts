import { randomUUID } from "node:crypto";

import { hasProAccess } from "@/lib/billing/plan";
import { formatSupabaseError } from "@/lib/api/errors";
import { logChatDev, logChatError } from "@/lib/meetings/chat-dev-log";
import { fetchProfilePlanFields } from "@/lib/supabase/profile-repository";
import {
  FREE_PLAN_MAX_ASSISTANT_REPLIES_PER_QUESTION,
  FREE_PLAN_MESSAGE_LIMIT,
} from "@/lib/meetings/constants";
import type { ChatMessage, MeetingDetail } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MeetingChatError = {
  error: string;
  limitReached?: boolean;
  status: number;
};

export type MeetingChatContext = {
  meeting: MeetingDetail;
  priorMessages: ChatMessage[];
  trimmed: string;
};

const CHAT_MESSAGE_COLUMNS =
  "id, meeting_id, user_id, role, content, created_at" as const;

export function countUserMessages(messages: ChatMessage[]): number {
  return messages.filter((message) => message.role === "user").length;
}

export async function syncMeetingMessageCount(
  supabase: SupabaseClient,
  meetingId: string,
  userId: string,
): Promise<void> {
  const { count, error: countError } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("meeting_id", meetingId)
    .eq("user_id", userId);

  if (countError) {
    logChatError("sync-count:failed", countError, { meetingId });
    return;
  }

  const { error: updateError } = await supabase
    .from("meetings")
    .update({
      message_count: count ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", meetingId)
    .eq("user_id", userId);

  if (updateError) {
    logChatError("sync-count:update-failed", updateError, { meetingId });
  } else {
    logChatDev("sync-count:success", { meetingId, messageCount: count ?? 0 });
  }
}

async function insertChatMessage(
  supabase: SupabaseClient,
  input: {
    id: string;
    meetingId: string;
    userId: string;
    role: "user" | "assistant";
    content: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("chat_messages").insert({
    id: input.id,
    meeting_id: input.meetingId,
    user_id: input.userId,
    role: input.role,
    content: input.content,
  });

  if (error) {
    logChatError("insert:message-failed", error, {
      meetingId: input.meetingId,
      role: input.role,
      messageId: input.id,
    });
    return {
      ok: false,
      error: formatSupabaseError(error, "Could not save chat message."),
    };
  }

  return { ok: true };
}

export async function loadMeetingChatContext(
  supabase: SupabaseClient,
  userId: string,
  meetingId: string,
  content: string,
  options?: { regenerate?: boolean },
): Promise<{ context?: MeetingChatContext; error?: MeetingChatError }> {
  const trimmed = content.trim();

  logChatDev("load:start", { meetingId, userId, contentLength: trimmed.length });

  if (!trimmed) {
    return {
      error: {
        error: "Enter a question to continue the conversation.",
        status: 400,
      },
    };
  }

  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (meetingError || !meeting) {
    logChatError("load:meeting-not-found", meetingError, { meetingId, userId });
    return {
      error: {
        error: "Meeting not found.",
        status: 404,
      },
    };
  }

  const { data: priorMessages, error: messagesError } = await supabase
    .from("chat_messages")
    .select(CHAT_MESSAGE_COLUMNS)
    .eq("meeting_id", meetingId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    logChatError("load:history-failed", messagesError, { meetingId });
    return {
      error: {
        error: "Could not load conversation history.",
        status: 500,
      },
    };
  }

  const messages = (priorMessages ?? []) as ChatMessage[];
  const userMessageCount = countUserMessages(messages);

  logChatDev("load:history", {
    meetingId,
    totalMessages: messages.length,
    userMessages: userMessageCount,
  });

  const profile = await fetchProfilePlanFields(
    supabase,
    userId,
    "loadMeetingChatContext/profile",
  );

  const isPro = hasProAccess(profile);
  const regenerate = options?.regenerate === true;

  if (
    !regenerate &&
    !isPro &&
    userMessageCount >= FREE_PLAN_MESSAGE_LIMIT
  ) {
    return {
      error: {
        error: `Free plan includes ${FREE_PLAN_MESSAGE_LIMIT} AI questions per meeting.`,
        limitReached: true,
        status: 403,
      },
    };
  }

  if (regenerate) {
    const userIndex = messages.findIndex(
      (m) => m.role === "user" && m.content.trim() === trimmed,
    );
    if (userIndex === -1) {
      return {
        error: {
          error: "Could not find the original question to regenerate.",
          status: 400,
        },
      };
    }

    if (!isPro) {
      let assistantReplies = 0;
      for (let i = userIndex + 1; i < messages.length; i++) {
        if (messages[i].role === "user") break;
        if (messages[i].role === "assistant") assistantReplies += 1;
      }
      if (assistantReplies >= FREE_PLAN_MAX_ASSISTANT_REPLIES_PER_QUESTION) {
        return {
          error: {
            error: `Free plan allows up to ${FREE_PLAN_MAX_ASSISTANT_REPLIES_PER_QUESTION} AI replies per question.`,
            limitReached: true,
            status: 403,
          },
        };
      }
    }
  }

  return {
    context: {
      meeting: meeting as MeetingDetail,
      priorMessages: messages,
      trimmed,
    },
  };
}

export type PersistedChatExchange = {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
};

export async function persistChatExchange(
  supabase: SupabaseClient,
  userId: string,
  meetingId: string,
  userContent: string,
  assistantContent: string,
): Promise<{ data?: PersistedChatExchange; error?: string }> {
  const userMessageId = randomUUID();
  const assistantMessageId = randomUUID();
  const now = new Date().toISOString();

  logChatDev("persist:start", {
    meetingId,
    userId,
    userMessageId,
    assistantMessageId,
    userLength: userContent.length,
    assistantLength: assistantContent.length,
  });

  const userInsert = await insertChatMessage(supabase, {
    id: userMessageId,
    meetingId,
    userId,
    role: "user",
    content: userContent,
  });

  if (!userInsert.ok) {
    return { error: userInsert.error };
  }

  const assistantInsert = await insertChatMessage(supabase, {
    id: assistantMessageId,
    meetingId,
    userId,
    role: "assistant",
    content: assistantContent,
  });

  if (!assistantInsert.ok) {
    await supabase.from("chat_messages").delete().eq("id", userMessageId);
    return { error: assistantInsert.error };
  }

  await syncMeetingMessageCount(supabase, meetingId, userId);

  const exchange: PersistedChatExchange = {
    userMessage: {
      id: userMessageId,
      meeting_id: meetingId,
      user_id: userId,
      role: "user",
      content: userContent,
      created_at: now,
    },
    assistantMessage: {
      id: assistantMessageId,
      meeting_id: meetingId,
      user_id: userId,
      role: "assistant",
      content: assistantContent,
      created_at: now,
    },
  };

  logChatDev("persist:success", {
    meetingId,
    userMessageId,
    assistantMessageId,
  });

  return { data: exchange };
}

/** @deprecated Use persistChatExchange — kept for server action compatibility */
export async function persistUserMessage(
  supabase: SupabaseClient,
  userId: string,
  meetingId: string,
  content: string,
  _currentMessageCount: number,
): Promise<{ error?: string; messageId?: string }> {
  const messageId = randomUUID();
  const result = await insertChatMessage(supabase, {
    id: messageId,
    meetingId,
    userId,
    role: "user",
    content,
  });

  if (!result.ok) return { error: result.error };

  await syncMeetingMessageCount(supabase, meetingId, userId);
  return { messageId };
}

/** @deprecated Use persistChatExchange */
export async function persistAssistantMessage(
  supabase: SupabaseClient,
  userId: string,
  meetingId: string,
  content: string,
  _currentMessageCount: number,
): Promise<{ error?: string; messageId?: string }> {
  const messageId = randomUUID();
  const result = await insertChatMessage(supabase, {
    id: messageId,
    meetingId,
    userId,
    role: "assistant",
    content,
  });

  if (!result.ok) return { error: result.error };

  await syncMeetingMessageCount(supabase, meetingId, userId);
  return { messageId };
}
