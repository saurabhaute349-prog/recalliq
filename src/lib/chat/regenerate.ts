import type { ChatMessage } from "@/types/database";

/** Drop the latest assistant message from AI context when regenerating. */
export function priorMessagesForRegenerate(
  messages: ChatMessage[],
): ChatMessage[] {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "assistant") {
      return [...messages.slice(0, i), ...messages.slice(i + 1)];
    }
  }
  return messages;
}

export function findPrecedingUserContent(
  messages: ChatMessage[],
  assistantId: string,
): string | null {
  const index = messages.findIndex((m) => m.id === assistantId);
  if (index <= 0) return null;

  for (let i = index - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") {
      return messages[i]!.content;
    }
  }
  return null;
}
