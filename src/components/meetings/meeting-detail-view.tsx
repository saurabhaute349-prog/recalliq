"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Brain,
  Loader2,
  MoreHorizontal,
  Send,
  Share2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FREE_PLAN_MESSAGE_LIMIT,
} from "@/lib/meetings/constants";
import { UpgradeLimitModal } from "@/components/billing/upgrade-limit-modal";
import { AssistantMessage } from "@/components/meetings/assistant-message";
import { FollowUpChips } from "@/components/meetings/follow-up-chips";
import { TranscriptPanel } from "@/components/meetings/transcript-panel";
import type { TranscriptCitation } from "@/lib/ai/citations";
import { generateFollowUpSuggestions } from "@/lib/chat/follow-up-suggestions";
import { findPrecedingUserContent } from "@/lib/chat/regenerate";
import { BRAND } from "@/lib/brand/config";
import { RelativeTime } from "@/components/shared/relative-time";
import { markOnboardingStep } from "@/lib/onboarding/actions";
import { formatMeetingDate } from "@/lib/meetings/format";
import { fadeIn, messageEnter } from "@/lib/motion";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import type { ChatMessage, MeetingDetail } from "@/types/database";

const DEFAULT_SUGGESTIONS = [
  "What were the action items?",
  "Summarize the meeting",
  "Who owns next steps?",
  "What decisions were made?",
];

type MeetingDetailViewProps = {
  meeting: MeetingDetail;
  initialMessages: ChatMessage[];
  userMessageCount: number;
  isPro: boolean;
  suggestedQuestions?: string[];
};

function UserMessage({ children }: { children: string }) {
  return (
    <article className="border-b border-border/80 py-6">
      <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        You
      </p>
      <p className="text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-foreground">
        {children}
      </p>
    </article>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 py-4 text-sm text-muted-foreground"
    >
      <Loader2 className="size-4 animate-spin text-primary" />
      {BRAND.name} is thinking…
    </motion.div>
  );
}

function MessageLimitUpgradeCard() {
  return (
    <motion.div
      {...messageEnter}
      className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm"
    >
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Free plan limit reached
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground">
        Free plan includes {FREE_PLAN_MESSAGE_LIMIT} AI questions per meeting.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Your conversation history stays available. Upgrade for unlimited
        questions on every meeting.
      </p>
      <Button className="mt-4 h-9" asChild>
        <Link href="/billing">Upgrade to Pro</Link>
      </Button>
    </motion.div>
  );
}

function createOptimisticMessage(
  role: ChatMessage["role"],
  content: string,
): ChatMessage {
  return {
    id: `optimistic-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    meeting_id: "",
    user_id: "",
    role,
    content,
    created_at: new Date().toISOString(),
  };
}

export function MeetingDetailView({
  meeting,
  initialMessages,
  userMessageCount: initialUserMessageCount,
  isPro,
  suggestedQuestions = DEFAULT_SUGGESTIONS,
}: MeetingDetailViewProps) {
  const quickPrompts = suggestedQuestions.length > 0 ? suggestedQuestions : DEFAULT_SUGGESTIONS;
  const router = useRouter();
  const mounted = useMounted();
  const [messages, setMessages] = useState(initialMessages);
  const [userMessageCount, setUserMessageCount] = useState(
    initialUserMessageCount,
  );
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [messageCitations, setMessageCitations] = useState<
    Record<string, TranscriptCitation[]>
  >({});
  const [highlightExcerpt, setHighlightExcerpt] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [followUpByMessage, setFollowUpByMessage] = useState<
    Record<string, string[]>
  >({});
  const [lastAiError, setLastAiError] = useState<string | null>(null);

  const messageLimitReached =
    !isPro && userMessageCount >= FREE_PLAN_MESSAGE_LIMIT;
  const composerDisabled = isSending || messageLimitReached;

  useEffect(() => {
    setMessages(initialMessages);
    setUserMessageCount(initialUserMessageCount);
    setStreamingMessageId(null);
  }, [meeting.id, initialMessages, initialUserMessageCount]);

  const resizeComposer = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 48), 160)}px`;
  }, []);

  useEffect(() => {
    resizeComposer();
  }, [input, resizeComposer]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, streamingMessageId]);

  const sendMessageWithStreaming = async (
    trimmed: string,
    options?: { regenerate?: boolean },
  ) => {
    const regenerate = options?.regenerate === true;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLastAiError(null);

    const userMessage = regenerate
      ? null
      : createOptimisticMessage("user", trimmed);
    const assistantMessage = createOptimisticMessage("assistant", "");

    setMessages((current) =>
      regenerate
        ? [...current, assistantMessage]
        : [...current, userMessage!, assistantMessage],
    );
    setStreamingMessageId(assistantMessage.id);
    if (!regenerate) {
      setUserMessageCount((count) => count + 1);
    }

    const response = await fetch(`/api/meetings/${meeting.id}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed, regenerate }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorMessage = "I could not generate a response right now. Please try again.";
      let limitReached = false;

      try {
        const payload = (await response.json()) as {
          error?: string;
          limitReached?: boolean;
        };
        errorMessage = payload.error ?? errorMessage;
        limitReached = Boolean(payload.limitReached);
      } catch {
        // Plain-text error bodies are ignored.
      }

      setMessages((current) =>
        current.filter((message) => {
          if (message.id === assistantMessage.id) return false;
          if (userMessage && message.id === userMessage.id) return false;
          return true;
        }),
      );
      if (!regenerate) {
        setUserMessageCount((count) => Math.max(0, count - 1));
      }
      setStreamingMessageId(null);
      setLastAiError(errorMessage);

      if (limitReached) {
        setUserMessageCount(FREE_PLAN_MESSAGE_LIMIT);
        setUpgradeModalOpen(true);
      }

      toast.error(errorMessage, {
        action: limitReached
          ? {
              label: "Upgrade to Pro",
              onClick: () => {
                window.location.href = "/billing";
              },
            }
          : undefined,
      });

      return false;
    }

    const refreshFromServer = () => {
      if (!mounted) return;
      startTransition(() => {
        router.refresh();
      });
    };

    const citationsHeader = response.headers.get("X-Transcript-Citations");
    if (citationsHeader) {
      try {
        const parsed = JSON.parse(
          decodeURIComponent(citationsHeader),
        ) as TranscriptCitation[];
        setMessageCitations((current) => ({
          ...current,
          [assistantMessage.id]: parsed,
        }));
      } catch {
        // ignore malformed citations
      }
    }

    if (!response.body) {
      setStreamingMessageId(null);
      refreshFromServer();
      return true;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        assistantText += decoder.decode(value, { stream: true });

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id
              ? { ...message, content: assistantText }
              : message,
          ),
        );
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        toast.message("Generation stopped");
      } else {
        toast.error(
          "The connection was interrupted. Refresh to see the latest messages.",
        );
      }
    } finally {
      abortRef.current = null;
      setStreamingMessageId(null);
      if (assistantText.trim()) {
        setFollowUpByMessage((current) => ({
          ...current,
          [assistantMessage.id]: generateFollowUpSuggestions(
            assistantText,
            meeting.transcript,
          ),
        }));
      }
      refreshFromServer();
      if (!regenerate) {
        void markOnboardingStep("askQuestion");
      }
    }

    return true;
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsSending(false);
    setStreamingMessageId(null);
  };

  const regenerateAnswer = (assistantId: string) => {
    const userContent = findPrecedingUserContent(messages, assistantId);
    if (!userContent?.trim() || composerDisabled) return;

    setIsSending(true);
    void sendMessageWithStreaming(userContent, { regenerate: true }).finally(
      () => setIsSending(false),
    );
  };

  const handleCitationClick = (citation: TranscriptCitation) => {
    setHighlightExcerpt(citation.excerpt || citation.lineHint);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || composerDisabled) return;

    setIsSending(true);
    setInput("");

    try {
      await sendMessageWithStreaming(trimmed, { regenerate: false });
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const showTypingIndicator =
    isSending && !streamingMessageId && messages.length > 0;

  return (
    <motion.div
      {...fadeIn}
      className="flex min-h-0 flex-1 flex-col overflow-hidden md:min-h-[calc(100dvh-10rem)] lg:min-h-[calc(100dvh-8rem)]"
    >
      <header className="shrink-0 border-b border-border px-0.5 pb-4 sm:pb-6">
        <motion.div
          {...fadeIn}
          className="flex flex-wrap items-start justify-between gap-4"
        >
          <div className="min-w-0 space-y-3">
            <Link
              href="/meetings"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Meetings
            </Link>
            <div>
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                {meeting.title}
              </h2>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>{formatMeetingDate(meeting.created_at)}</span>
                <span className="text-border">?</span>
                <RelativeTime isoDate={meeting.created_at} />
                <span className="text-border">?</span>
                <span>{meeting.participant_count} participants</span>
              </p>
              {meeting.summary ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {meeting.summary}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" className="h-8" type="button">
              <Share2 className="size-3.5" />
              Share
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" type="button">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Rename meeting</DropdownMenuItem>
                <DropdownMenuItem>Export transcript</DropdownMenuItem>
                <DropdownMenuItem variant="destructive">
                  Delete memory
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
          <Brain className="size-3.5 text-primary" />
          Memory active ? this conversation is saved to this meeting
        </div>
      </header>

      <TranscriptPanel
        transcript={meeting.transcript}
        highlightExcerpt={highlightExcerpt}
        forceOpen={Boolean(highlightExcerpt)}
      />
      <UpgradeLimitModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        reason="messages"
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mx-auto w-full min-h-0 max-w-2xl flex-1 overflow-x-hidden overflow-y-auto px-1 py-2 sm:px-0.5">
          {messages.length === 0 ? (
            <motion.div
              {...fadeIn}
              className="rounded-2xl border border-primary/15 bg-gradient-to-b from-primary/5 to-transparent p-8 text-center shadow-sm"
            >
              <Sparkles className="mx-auto size-8 text-primary" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">Ask your meeting memory</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Answers are grounded in this transcript with speaker citations.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={composerDisabled}
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((message) =>
              message.role === "user" ? (
                <UserMessage key={message.id}>{message.content}</UserMessage>
              ) : (
                <div key={message.id}>
                  <AssistantMessage
                    isStreaming={
                      isSending && message.id === streamingMessageId
                    }
                    citations={messageCitations[message.id]}
                    onCitationClick={handleCitationClick}
                    onRegenerate={() => regenerateAnswer(message.id)}
                    onStop={stopGeneration}
                    showStop={
                      isSending && message.id === streamingMessageId
                    }
                  >
                    {message.content ||
                      (message.id === streamingMessageId
                        ? `${BRAND.name} is thinking…`
                        : "")}
                  </AssistantMessage>
                  {followUpByMessage[message.id] &&
                  message.id !== streamingMessageId &&
                  message.content ? (
                    <FollowUpChips
                      suggestions={followUpByMessage[message.id]!}
                      onSelect={(text) => void sendMessage(text)}
                      disabled={composerDisabled}
                    />
                  ) : null}
                </div>
              ),
            )
          )}
          {lastAiError && !isSending ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <p>{lastAiError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 h-8"
                onClick={() => {
                  setLastAiError(null);
                  textareaRef.current?.focus();
                }}
              >
                Try again
              </Button>
            </div>
          ) : null}
          <AnimatePresence>
            {showTypingIndicator && <TypingIndicator />}
          </AnimatePresence>
          <div ref={threadEndRef} className="h-4" />
        </div>

        {!messageLimitReached && (
          <div className="mx-auto w-full max-w-2xl shrink-0 py-3">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={composerDisabled}
                  onClick={() => {
                    setInput(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="sticky bottom-0 z-10 mx-auto w-full max-w-2xl shrink-0 space-y-4 border-t border-border bg-background/95 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:pt-4">
          {messageLimitReached ? (
            <MessageLimitUpgradeCard />
          ) : (
            <form onSubmit={handleSubmit}>
              <motion.div
                layout
                className="rounded-xl border border-border bg-card shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20"
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage(input);
                    }
                  }}
                  placeholder="Ask anything about this meeting?"
                  rows={1}
                  disabled={composerDisabled}
                  className="block w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-60"
                  aria-label="Ask about this meeting"
                />
                <div className="flex items-center justify-between border-t border-border/80 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    {isPro
                      ? "Unlimited AI questions"
                      : `${userMessageCount}/${FREE_PLAN_MESSAGE_LIMIT} questions used`}
                    ? Enter to send
                  </p>
                  {isSending ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={stopGeneration}
                    >
                      Stop
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8"
                      disabled={!input.trim() || composerDisabled}
                    >
                      <Send className="size-4" />
                      Send
                    </Button>
                  )}
                </div>
              </motion.div>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
