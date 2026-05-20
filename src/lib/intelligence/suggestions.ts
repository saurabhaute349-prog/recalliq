import type { MeetingIntelligence, MeetingType } from "@/types/database";

const BASE_SUGGESTIONS = [
  "What were the action items?",
  "What decisions were made?",
  "Who owns next steps?",
  "Summarize this meeting",
];

const TYPE_SUGGESTIONS: Record<string, string[]> = {
  sales: [
    "What objections did the prospect raise?",
    "What are the next steps in the deal?",
    "Who are the key stakeholders?",
  ],
  standup: [
    "What blockers were mentioned?",
    "What is each person working on?",
    "What shipped since last standup?",
  ],
  interview: [
    "What were the candidate's strengths?",
    "What concerns were raised?",
    "What are the recommended next steps?",
  ],
  product: [
    "What features were discussed?",
    "What are the priorities?",
    "What technical risks came up?",
  ],
  customer_call: [
    "What customer complaints were raised?",
    "What feature requests came up?",
    "What follow-ups were promised?",
  ],
  general: [
    "What blockers were discussed?",
    "What deadlines were mentioned?",
    "What risks were identified?",
  ],
};

export function buildSuggestedQuestions(
  intelligence: Partial<MeetingIntelligence> | null,
): string[] {
  const suggestions = new Set<string>(BASE_SUGGESTIONS);

  const meetingType = intelligence?.meeting_type ?? "general";
  for (const item of TYPE_SUGGESTIONS[meetingType] ?? TYPE_SUGGESTIONS.general) {
    suggestions.add(item);
  }

  if (intelligence?.blockers?.length) {
    suggestions.add("What blockers were discussed?");
  }
  if (intelligence?.deadlines?.length) {
    suggestions.add("What deadlines were mentioned?");
  }
  if (intelligence?.decisions?.length) {
    suggestions.add("List the key decisions");
  }
  if (intelligence?.people?.length && intelligence.people.length >= 2) {
    suggestions.add(`What did ${intelligence.people[0]} commit to?`);
  }
  if (intelligence?.action_items?.length) {
    suggestions.add("List action items with owners");
  }

  const cached = intelligence?.suggested_questions ?? [];
  for (const q of cached) {
    if (q.trim()) suggestions.add(q.trim());
  }

  return [...suggestions].slice(0, 10);
}

export function meetingTypeFromTranscript(transcript: string): MeetingType {
  const lower = transcript.toLowerCase();
  if (/\b(standup|daily sync|scrum)\b/.test(lower)) return "standup";
  if (/\b(interview|candidate|hiring)\b/.test(lower)) return "interview";
  if (/\b(demo|discovery|proposal|quota|pipeline)\b/.test(lower)) return "sales";
  if (/\b(customer|client|churn|support ticket)\b/.test(lower)) return "customer_call";
  if (/\b(roadmap|feature|sprint|backlog|prd)\b/.test(lower)) return "product";
  return "general";
}
