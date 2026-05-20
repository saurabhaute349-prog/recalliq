import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { buildTranscriptCitations } from "@/lib/ai/citations";
import { streamMeetingReply } from "@/lib/ai/gemini";
import { getGeminiErrorMessage } from "@/lib/ai/errors";
import { getMeetingIntelligenceWithClient } from "@/lib/intelligence/queries";
import { notifyAiQuestionLimitReached } from "@/lib/email/limits";
import { logChatDev, logChatError } from "@/lib/meetings/chat-dev-log";
import { priorMessagesForRegenerate } from "@/lib/chat/regenerate";
import {
  countUserMessages,
  loadMeetingChatContext,
  persistAssistantMessage,
  persistUserMessage,
} from "@/lib/meetings/chat-service";
import { getAuthenticatedUser, getUserProfile } from "@/lib/meetings/queries";

export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id: meetingId } = await context.params;

  let body: { content?: string; regenerate?: boolean };

  try {
    body = (await request.json()) as {
      content?: string;
      regenerate?: boolean;
    };
  } catch {
    return NextResponse.json(
      { error: "Invalid request. Please try again." },
      { status: 400 },
    );
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 },
    );
  }

  const regenerate = body.regenerate === true;

  const loaded = await loadMeetingChatContext(
    supabase,
    user.id,
    meetingId,
    body.content ?? "",
    { regenerate },
  );

  if (loaded.error) {
    return NextResponse.json(
      {
        error: loaded.error.error,
        limitReached: loaded.error.limitReached,
      },
      { status: loaded.error.status },
    );
  }

  const { meeting, priorMessages, trimmed } = loaded.context!;

  const intelligence = await getMeetingIntelligenceWithClient(
    supabase,
    meetingId,
    user.id,
  );

  const citations = buildTranscriptCitations(meeting.transcript, trimmed);

  logChatDev("stream:start", {
    meetingId,
    priorCount: priorMessages.length,
    citationCount: citations.length,
  });

  if (!regenerate) {
    const userPersist = await persistUserMessage(
      supabase,
      user.id,
      meetingId,
      trimmed,
      meeting.message_count,
    );

    if (userPersist.error) {
      logChatError("stream:user-save-failed", null, {
        error: userPersist.error,
      });
      return NextResponse.json({ error: userPersist.error }, { status: 500 });
    }

    logChatDev("stream:user-saved", { messageId: userPersist.messageId });
  }

  const messagesForAi = regenerate
    ? priorMessagesForRegenerate(priorMessages)
    : priorMessages;

  const encoder = new TextEncoder();
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();

  void (async () => {
    try {
      const assistantContent = await streamMeetingReply({
        transcript: meeting.transcript,
        priorMessages: messagesForAi,
        question: trimmed,
        intelligence,
        signal: request.signal,
        onChunk: async (chunk) => {
          if (request.signal.aborted) return;
          await writer.write(encoder.encode(chunk));
        },
      });

      const assistantPersist = await persistAssistantMessage(
        supabase,
        user.id,
        meetingId,
        assistantContent,
        meeting.message_count,
      );

      if (assistantPersist.error) {
        logChatError("stream:assistant-save-failed", null, {
          error: assistantPersist.error,
        });
        await writer.write(
          encoder.encode(
            `\n\n${assistantPersist.error}`,
          ),
        );
      } else {
        logChatDev("stream:assistant-saved", {
          messageId: assistantPersist.messageId,
        });
      }

      const profile = await getUserProfile();
      const userMessageCount = regenerate
        ? countUserMessages(priorMessages)
        : countUserMessages(priorMessages) + 1;

      if (!regenerate && user.email) {
        await notifyAiQuestionLimitReached({
          email: user.email,
          profile,
          userMessageCount,
        });
      }

      revalidatePath(`/meetings/${meetingId}`);
      revalidatePath("/meetings");
      revalidatePath("/dashboard");
    } catch (error) {
      if (request.signal.aborted) {
        logChatDev("stream:aborted", { meetingId });
        return;
      }

      const message = getGeminiErrorMessage(error);

      try {
        await persistAssistantMessage(
          supabase,
          user.id,
          meetingId,
          message,
          meeting.message_count,
        );
        await writer.write(encoder.encode(message));
      } catch {
        await writer.write(
          encoder.encode(
            "I could not generate a response right now. Please try again.",
          ),
        );
      }

      revalidatePath(`/meetings/${meetingId}`);
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Transcript-Citations": encodeURIComponent(
        JSON.stringify(citations),
      ),
    },
  });
}
