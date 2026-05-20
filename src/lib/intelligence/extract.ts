import { extractMeetingIntelligenceJson } from "@/lib/ai/gemini";
import {
  logIntelligenceDev,
  logIntelligenceError,
} from "@/lib/intelligence/intelligence-dev-log";
import { parseIntelligenceJson } from "@/lib/intelligence/parse";
import {
  extractActionItemsHeuristic,
  extractBlockersHeuristic,
  extractDeadlinesHeuristic,
  extractSpeakers,
} from "@/lib/intelligence/regex-extract";
import { buildSuggestedQuestions, meetingTypeFromTranscript } from "@/lib/intelligence/suggestions";
import type { MeetingIntelligence } from "@/types/database";

export type ExtractedIntelligence = Omit<
  MeetingIntelligence,
  "id" | "meeting_id" | "user_id" | "created_at" | "updated_at"
>;

function mergeUniqueStrings(...lists: (string[] | undefined)[]): string[] {
  const set = new Set<string>();
  for (const list of lists) {
    for (const item of list ?? []) {
      if (item.trim()) set.add(item.trim());
    }
  }
  return [...set];
}

export async function extractMeetingIntelligence(
  transcript: string,
): Promise<ExtractedIntelligence> {
  logIntelligenceDev("extract:start", { transcriptLength: transcript.length });

  const heuristic = {
    people: extractSpeakers(transcript),
    action_items: extractActionItemsHeuristic(transcript),
    blockers: extractBlockersHeuristic(transcript),
    deadlines: extractDeadlinesHeuristic(transcript),
    meeting_type: meetingTypeFromTranscript(transcript),
  };

  let aiPartial: Partial<MeetingIntelligence> | null = null;

  try {
    const raw = await extractMeetingIntelligenceJson(transcript);
    aiPartial = parseIntelligenceJson(raw);
    logIntelligenceDev("extract:ai-parsed", {
      hasAi: Boolean(aiPartial),
      people: aiPartial?.people?.length ?? 0,
    });
  } catch (error) {
    logIntelligenceError("extract:ai-failed", error);
  }

  const people = mergeUniqueStrings(heuristic.people, aiPartial?.people);
  const action_items = [
    ...(aiPartial?.action_items ?? []),
    ...heuristic.action_items,
  ].filter(
    (item, index, arr) =>
      arr.findIndex((other) => other.task.toLowerCase() === item.task.toLowerCase()) ===
      index,
  );

  const draft: ExtractedIntelligence = {
    people,
    companies: aiPartial?.companies ?? [],
    action_items: action_items.slice(0, 15),
    blockers: mergeUniqueStrings(heuristic.blockers, aiPartial?.blockers),
    deadlines: mergeUniqueStrings(heuristic.deadlines, aiPartial?.deadlines),
    decisions: aiPartial?.decisions ?? [],
    risks: aiPartial?.risks ?? [],
    product_names: aiPartial?.product_names ?? [],
    priorities: aiPartial?.priorities ?? [],
    summary: aiPartial?.summary ?? null,
    meeting_type: aiPartial?.meeting_type ?? heuristic.meeting_type,
    suggested_questions: [],
  };

  draft.suggested_questions = buildSuggestedQuestions(draft);

  logIntelligenceDev("extract:complete", {
    people: draft.people.length,
    actionItems: draft.action_items.length,
    suggestions: draft.suggested_questions.length,
    meetingType: draft.meeting_type,
  });

  return draft;
}
