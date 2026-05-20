import type { IntelligenceActionItem } from "@/types/database";

export const DEMO_MEETING_TITLE = "Product sync — Q2 launch (Demo)";

export const DEMO_TRANSCRIPT = `Alex Chen: Thanks everyone. Goal today is to align on the Q2 launch for Recalliq onboarding.
Sarah Patel: Design is ready for the guided wizard. We need engineering sign-off by Thursday.
Jordan Lee: API stability looks good. Main risk is Supabase migration timing on production.
Alex Chen: Decision — we ship onboarding v2 next Wednesday if QA passes Monday.
Sarah Patel: I'll own the empty states and demo meeting flow. Target Friday EOD.
Jordan Lee: I'll own performance on large transcripts. Need a 80k character stress test.
Maria Gomez: Customer call yesterday — three teams asked for command palette search. Adding to sprint.
Alex Chen: Blocker — billing webhook still flaky in staging. Jordan, can you pair with infra tomorrow?
Jordan Lee: Yes. I'll schedule a working session with infra at 10am Tuesday.
Sarah Patel: Marketing wants a 30-second demo video. I'll draft script by Monday.
Alex Chen: Action item — Alex to email beta users about the launch window by end of week.
Maria Gomez: Deadline — beta announcement should go out before May 28.
Alex Chen: Any objections? None heard. Meeting adjourned.`;

export const DEMO_SUMMARY =
  "The team aligned on shipping Recalliq onboarding v2 next Wednesday, pending QA Monday. Sarah owns wizard UX and demo flow; Jordan owns transcript performance and billing webhook fixes with infra. Maria captured customer demand for command palette search. Beta announcement target is before May 28.";

export const DEMO_CHAT_EXAMPLES = [
  {
    role: "user" as const,
    content: "What decisions were made?",
  },
  {
    role: "assistant" as const,
    content: `Key decisions from this meeting:

- **Ship onboarding v2 next Wednesday** if QA passes on Monday.
- **Sarah** delivers guided wizard empty states and demo meeting flow by Friday EOD.
- **Jordan** owns large-transcript performance testing (80k character target).
- **Beta announcement** should go out before **May 28**.`,
  },
  {
    role: "user" as const,
    content: "Who owns next steps?",
  },
  {
    role: "assistant" as const,
    content: `Ownership mentioned in the transcript:

- **Sarah Patel** — empty states, demo meeting flow, marketing demo script (Monday).
- **Jordan Lee** — transcript performance stress test; billing webhook fix with infra (Tuesday 10am).
- **Alex Chen** — email beta users about launch window (end of week).
- **Maria Gomez** — captured command palette customer feedback for sprint.`,
  },
];

export const DEMO_ACTION_ITEMS: IntelligenceActionItem[] = [
  {
    task: "Ship onboarding v2",
    owner: "Team",
    deadline: "Next Wednesday",
  },
  {
    task: "Guided wizard + demo meeting flow",
    owner: "Sarah Patel",
    deadline: "Friday EOD",
  },
  {
    task: "80k transcript stress test",
    owner: "Jordan Lee",
    deadline: null,
  },
  {
    task: "Email beta users about launch window",
    owner: "Alex Chen",
    deadline: "End of week",
  },
];

export const DEMO_SUGGESTED_QUESTIONS = [
  "What decisions were made?",
  "Who owns next steps?",
  "What blockers were discussed?",
  "Summarize this meeting",
  "What deadlines were mentioned?",
  "What did customers ask for?",
];

export const DEMO_INTELLIGENCE = {
  people: ["Alex Chen", "Sarah Patel", "Jordan Lee", "Maria Gomez"],
  companies: [],
  action_items: DEMO_ACTION_ITEMS,
  blockers: [
    "Billing webhook still flaky in staging — Jordan to pair with infra Tuesday 10am",
  ],
  deadlines: ["QA pass by Monday", "Beta announcement before May 28", "Sarah design sign-off by Thursday"],
  decisions: [
    "Ship onboarding v2 next Wednesday if QA passes Monday",
    "Command palette search added to sprint based on customer calls",
  ],
  risks: ["Supabase migration timing on production"],
  product_names: ["Recalliq"],
  priorities: ["Onboarding v2", "Command palette", "Billing stability"],
  summary: DEMO_SUMMARY,
  suggested_questions: DEMO_SUGGESTED_QUESTIONS,
  meeting_type: "product" as const,
};
