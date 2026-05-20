import {
  chunkTranscript,
  selectRelevantChunks,
} from "@/lib/ai/context-builder";
import { detectQuestionIntent } from "@/lib/ai/question-types";

export type TranscriptCitation = {
  id: string;
  speaker: string | null;
  excerpt: string;
  lineHint: string;
};

function extractSpeaker(chunk: string): string | null {
  const match = chunk.match(/^([A-Z][a-zA-Z0-9_.\s-]{0,30}):/m);
  return match?.[1]?.trim() ?? null;
}

function firstLine(chunk: string): string {
  return chunk.split("\n")[0]?.trim() ?? chunk.slice(0, 120);
}

export function buildTranscriptCitations(
  transcript: string,
  question: string,
): TranscriptCitation[] {
  const intent = detectQuestionIntent(question);
  const chunks = chunkTranscript(transcript);
  const selected = selectRelevantChunks(transcript, question, intent);

  return selected.map((chunk, index) => {
    const chunkIndex = chunks.indexOf(chunk);
    return {
      id: `c${chunkIndex >= 0 ? chunkIndex : index}`,
      speaker: extractSpeaker(chunk),
      excerpt: chunk.slice(0, 160).replace(/\s+/g, " ").trim(),
      lineHint: firstLine(chunk),
    };
  });
}

export function extractSpeakersFromAnswer(text: string): string[] {
  const names = new Set<string>();
  const bracketMatches = text.matchAll(/\[([A-Z][a-zA-Z0-9_.\s-]{1,30})\]/g);
  for (const match of bracketMatches) {
    if (match[1]) names.add(match[1].trim());
  }
  return [...names];
}
