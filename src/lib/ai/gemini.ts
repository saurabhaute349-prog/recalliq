import { GoogleGenerativeAI } from "@google/generative-ai";

import { logAiDev, logAiError } from "@/lib/ai/ai-dev-log";
import { buildMeetingChatPrompt } from "@/lib/ai/context-builder";
import { getGeminiErrorMessage } from "@/lib/ai/errors";
import { buildIntelligenceExtractionPrompt, buildSummaryPrompt } from "@/lib/ai/prompts";
import type { ChatMessage } from "@/types/database";
import type { MeetingIntelligence } from "@/types/database";

const GEMINI_MODEL = "gemini-2.5-flash";

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return apiKey;
}

function getModel(temperature = 0.2) {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());

  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature,
      topP: 0.9,
      maxOutputTokens: 1024,
    },
  });
}

export async function generateMeetingReply(input: {
  transcript: string;
  priorMessages: ChatMessage[];
  question: string;
  intelligence?: MeetingIntelligence | null;
}): Promise<string> {
  const model = getModel();
  const { intent, prompt } = buildMeetingChatPrompt(input);

  logAiDev("reply:start", {
    intent,
    questionLength: input.question.length,
  });

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    if (!text) {
      return "I could not generate a response right now. Please try again.";
    }

    logAiDev("reply:success", { intent, responseLength: text.length });
    return text;
  } catch (error) {
    logAiError("reply:failed", error, { intent });
    throw new Error(getGeminiErrorMessage(error));
  }
}

export async function generateMeetingSummary(transcript: string): Promise<string> {
  const model = getModel(0.15);
  const snippet = transcript.trim().slice(0, 12_000);
  const prompt = buildSummaryPrompt(snippet);

  logAiDev("summary:start", { transcriptLength: snippet.length });

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    if (!text) return "";

    logAiDev("summary:success", { length: text.length });
    return text;
  } catch (error) {
    logAiError("summary:failed", error);
    return "";
  }
}

export async function extractMeetingIntelligenceJson(
  transcript: string,
): Promise<string> {
  const model = getModel(0.1);
  const snippet = transcript.trim().slice(0, 14_000);
  const prompt = `${buildIntelligenceExtractionPrompt(snippet)}\n\nTRANSCRIPT:\n${snippet}`;

  logAiDev("intelligence-extract:start", { transcriptLength: snippet.length });

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  logAiDev("intelligence-extract:success", { length: text.length });
  return text;
}

export async function streamMeetingReply(input: {
  transcript: string;
  priorMessages: ChatMessage[];
  question: string;
  intelligence?: MeetingIntelligence | null;
  onChunk: (chunk: string) => Promise<void> | void;
  signal?: AbortSignal;
}): Promise<string> {
  const model = getModel();
  const { intent, prompt } = buildMeetingChatPrompt(input);

  logAiDev("stream:start", { intent, questionLength: input.question.length });

  try {
    const result = await model.generateContentStream(prompt);
    let fullText = "";

    for await (const chunk of result.stream) {
      if (input.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const text = chunk.text();

      if (!text) continue;

      fullText += text;
      await input.onChunk(text);
    }

    const trimmed = fullText.trim();

    if (!trimmed) {
      return "I could not generate a response right now. Please try again.";
    }

    logAiDev("stream:success", { intent, responseLength: trimmed.length });
    return trimmed;
  } catch (error) {
    logAiError("stream:failed", error, { intent });
    throw new Error(getGeminiErrorMessage(error));
  }
}
