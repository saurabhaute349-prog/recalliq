import { logAiDev } from "@/lib/ai/ai-dev-log";
import { CORE_SYSTEM_RULES, getIntentInstructions } from "@/lib/ai/prompts";
import {
  detectQuestionIntent,
  intentLabel,
  type QuestionIntent,
} from "@/lib/ai/question-types";
import {
  MAX_PRIOR_MESSAGES,
  MAX_TRANSCRIPT_CHARS,
} from "@/lib/meetings/constants";
import type { ChatMessage } from "@/types/database";
import type { MeetingIntelligence } from "@/types/database";

const CHUNK_TARGET_CHARS = 1_200;
const MAX_RELEVANT_CHUNKS = 8;
const MIN_CHUNK_SCORE = 0.05;

export type BuiltChatContext = {
  intent: QuestionIntent;
  prompt: string;
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

export function chunkTranscript(transcript: string): string[] {
  const normalized = transcript.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const speakerBlocks = normalized.split(/\n(?=[A-Z][a-zA-Z0-9_.-]{0,24}:\s)/);
  const chunks: string[] = [];
  let buffer = "";

  for (const block of speakerBlocks) {
    const piece = block.trim();
    if (!piece) continue;

    if (buffer.length + piece.length + 1 <= CHUNK_TARGET_CHARS) {
      buffer = buffer ? `${buffer}\n${piece}` : piece;
    } else {
      if (buffer) chunks.push(buffer);
      if (piece.length <= CHUNK_TARGET_CHARS) {
        buffer = piece;
      } else {
        for (let i = 0; i < piece.length; i += CHUNK_TARGET_CHARS) {
          chunks.push(piece.slice(i, i + CHUNK_TARGET_CHARS));
        }
        buffer = "";
      }
    }
  }

  if (buffer) chunks.push(buffer);

  if (chunks.length === 0) {
    for (let i = 0; i < normalized.length; i += CHUNK_TARGET_CHARS) {
      chunks.push(normalized.slice(i, i + CHUNK_TARGET_CHARS));
    }
  }

  return chunks;
}

function scoreChunk(
  chunk: string,
  questionTokens: string[],
  intent: QuestionIntent,
): number {
  const chunkTokens = new Set(tokenize(chunk));
  if (chunkTokens.size === 0 || questionTokens.length === 0) return 0;

  let overlap = 0;
  for (const token of questionTokens) {
    if (chunkTokens.has(token)) overlap += 1;
  }

  let score = overlap / questionTokens.length;

  const intentKeywords: Record<QuestionIntent, string[]> = {
    action_items: ["action", "task", "follow", "will", "need", "assign"],
    decisions: ["decide", "agreed", "approved", "conclude"],
    blockers: ["block", "risk", "issue", "stuck", "delay"],
    ownership: ["owner", "responsible", "lead", "drive"],
    timeline: ["deadline", "friday", "monday", "week", "date", "due"],
    customer_issues: ["customer", "client", "complaint", "feedback"],
    summary: [],
    general: [],
  };

  for (const keyword of intentKeywords[intent]) {
    if (chunk.toLowerCase().includes(keyword)) score += 0.08;
  }

  return score;
}

export function selectRelevantChunks(
  transcript: string,
  question: string,
  intent: QuestionIntent,
): string[] {
  const chunks = chunkTranscript(transcript);
  if (chunks.length === 0) return [];

  const questionTokens = tokenize(question);
  const scored = chunks
    .map((chunk, index) => ({
      chunk,
      index,
      score: scoreChunk(chunk, questionTokens, intent),
    }))
    .sort((a, b) => b.score - a.score);

  const top = scored
    .filter((item) => item.score >= MIN_CHUNK_SCORE)
    .slice(0, MAX_RELEVANT_CHUNKS);

  if (top.length === 0) {
    return chunks.slice(0, MAX_RELEVANT_CHUNKS);
  }

  return top
    .sort((a, b) => a.index - b.index)
    .map((item) => item.chunk);
}

function compressTranscriptForPrompt(chunks: string[]): string {
  const joined = chunks.join("\n\n---\n\n");
  if (joined.length <= MAX_TRANSCRIPT_CHARS) return joined;
  return `${joined.slice(0, MAX_TRANSCRIPT_CHARS)}\n\n[Transcript context truncated.]`;
}

function formatPriorConversation(messages: ChatMessage[]): string {
  const recent = messages.slice(-MAX_PRIOR_MESSAGES);
  if (recent.length === 0) return "No prior messages in this thread.";

  return recent
    .map((message) => {
      const speaker = message.role === "user" ? "User" : "Assistant";
      return `${speaker}: ${message.content}`;
    })
    .join("\n\n");
}

function formatIntelligenceBlock(intelligence: MeetingIntelligence | null | undefined): string {
  if (!intelligence) return "No pre-extracted intelligence available.";

  const lines: string[] = [];

  if (intelligence.summary) {
    lines.push(`Summary: ${intelligence.summary}`);
  }
  if (intelligence.people?.length) {
    lines.push(`People: ${intelligence.people.join(", ")}`);
  }
  if (intelligence.decisions?.length) {
    lines.push(`Decisions: ${intelligence.decisions.join("; ")}`);
  }
  if (intelligence.action_items?.length) {
    const items = intelligence.action_items
      .map((item) => {
        const parts = [item.task];
        if (item.owner) parts.push(`owner: ${item.owner}`);
        if (item.deadline) parts.push(`by: ${item.deadline}`);
        return parts.join(" — ");
      })
      .join("; ");
    lines.push(`Action items: ${items}`);
  }
  if (intelligence.blockers?.length) {
    lines.push(`Blockers: ${intelligence.blockers.join("; ")}`);
  }
  if (intelligence.deadlines?.length) {
    lines.push(`Deadlines: ${intelligence.deadlines.join("; ")}`);
  }

  return lines.length > 0 ? lines.join("\n") : "No pre-extracted intelligence available.";
}

export function buildMeetingChatPrompt(input: {
  transcript: string;
  priorMessages: ChatMessage[];
  question: string;
  intelligence?: MeetingIntelligence | null;
}): BuiltChatContext {
  const intent = detectQuestionIntent(input.question);
  const relevantChunks = selectRelevantChunks(
    input.transcript,
    input.question,
    intent,
  );
  const transcriptContext = compressTranscriptForPrompt(relevantChunks);
  const intelligenceBlock = formatIntelligenceBlock(input.intelligence);

  logAiDev("context:built", {
    intent,
    intentLabel: intentLabel(intent),
    chunkCount: relevantChunks.length,
    contextChars: transcriptContext.length,
    hasIntelligence: Boolean(input.intelligence),
  });

  const prompt = `${CORE_SYSTEM_RULES}

QUESTION TYPE: ${intentLabel(intent)}
${getIntentInstructions(intent)}

EXTRACTED INTELLIGENCE (secondary reference — transcript excerpts take precedence):
${intelligenceBlock}

MEETING TRANSCRIPT EXCERPTS (primary source):
${transcriptContext}

PRIOR CONVERSATION:
${formatPriorConversation(input.priorMessages)}

LATEST USER QUESTION:
${input.question.trim()}

Respond to the latest user question using only the transcript excerpts and extracted intelligence above.`;

  return { intent, prompt };
}
