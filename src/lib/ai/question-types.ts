export const QUESTION_INTENTS = [
  "summary",
  "decisions",
  "action_items",
  "blockers",
  "ownership",
  "timeline",
  "customer_issues",
  "general",
] as const;

export type QuestionIntent = (typeof QUESTION_INTENTS)[number];

const INTENT_PATTERNS: { intent: QuestionIntent; patterns: RegExp[] }[] = [
  {
    intent: "action_items",
    patterns: [
      /\baction\s*items?\b/i,
      /\bnext\s*steps?\b/i,
      /\btasks?\b/i,
      /\btodo\b/i,
      /\bfollow[\s-]?ups?\b/i,
      /\bassigned\b/i,
    ],
  },
  {
    intent: "decisions",
    patterns: [
      /\bdecisions?\b/i,
      /\bagreed\b/i,
      /\bconcluded\b/i,
      /\bresolved\b/i,
      /\bapproved\b/i,
    ],
  },
  {
    intent: "blockers",
    patterns: [
      /\bblockers?\b/i,
      /\bblocked\b/i,
      /\bstuck\b/i,
      /\bimpediments?\b/i,
      /\brisks?\b/i,
      /\bissues?\b/i,
    ],
  },
  {
    intent: "ownership",
    patterns: [
      /\bwho\s+owns\b/i,
      /\bwho\s+is\s+responsible\b/i,
      /\bowners?\b/i,
      /\baccountable\b/i,
      /\bassigned\s+to\b/i,
      /\bwho\s+will\b/i,
    ],
  },
  {
    intent: "timeline",
    patterns: [
      /\bdeadlines?\b/i,
      /\bdue\s+dates?\b/i,
      /\bwhen\b/i,
      /\btimeline\b/i,
      /\bschedule\b/i,
      /\bby\s+(monday|tuesday|wednesday|thursday|friday|next week|end of)/i,
    ],
  },
  {
    intent: "customer_issues",
    patterns: [
      /\bcustomer\b/i,
      /\bclient\b/i,
      /\bcomplaints?\b/i,
      /\bfeedback\b/i,
      /\bchurn\b/i,
      /\bsupport\b/i,
    ],
  },
  {
    intent: "summary",
    patterns: [
      /\bsummar(y|ize)\b/i,
      /\brecap\b/i,
      /\boverview\b/i,
      /\bhigh[\s-]?level\b/i,
      /\bwhat\s+happened\b/i,
      /\bmain\s+points?\b/i,
    ],
  },
];

export function detectQuestionIntent(question: string): QuestionIntent {
  const trimmed = question.trim();
  if (!trimmed) return "general";

  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(trimmed))) {
      return intent;
    }
  }

  return "general";
}

export function intentLabel(intent: QuestionIntent): string {
  switch (intent) {
    case "summary":
      return "Summary";
    case "decisions":
      return "Decisions";
    case "action_items":
      return "Action items";
    case "blockers":
      return "Blockers";
    case "ownership":
      return "Ownership";
    case "timeline":
      return "Timeline";
    case "customer_issues":
      return "Customer issues";
    default:
      return "General";
  }
}
