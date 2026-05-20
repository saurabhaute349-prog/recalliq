const TITLE_RULES: { pattern: RegExp; title: string }[] = [
  { pattern: /\b(standup|stand-up)\b/i, title: "Weekly Team Standup" },
  { pattern: /\b(sales|prospect|discovery)\b/i, title: "Sales Discovery Call" },
  { pattern: /\b(product|roadmap|onboarding)\b/i, title: "Product Strategy Sync" },
  { pattern: /\b(budget|finance|forecast)\b/i, title: "Budget Planning Review" },
  { pattern: /\b(interview|hiring|candidate)\b/i, title: "Hiring Interview" },
  { pattern: /\b(retro|retrospective)\b/i, title: "Team Retrospective" },
  { pattern: /\b(design|critique|ux|ui)\b/i, title: "Design Review" },
  { pattern: /\b(customer|client|acme)\b/i, title: "Customer Discovery Call" },
  { pattern: /\b(sync|check-?in)\b/i, title: "Team Sync" },
  { pattern: /\b(planning|sprint)\b/i, title: "Sprint Planning" },
];

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function titleFromFirstLine(transcript: string): string | null {
  const firstLine = transcript
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return null;

  const withoutSpeaker = firstLine
    .replace(/^([A-Za-z][A-Za-z\s.'-]{0,40}?)\s*[:·]\s*/, "")
    .trim();

  if (withoutSpeaker.length < 8) return null;

  const snippet = withoutSpeaker.slice(0, 48).replace(/[.,;:!?]+$/, "");
  return titleCase(snippet);
}

export function generateTitleFromTranscript(transcript: string): string {
  const normalized = transcript.trim();

  for (const rule of TITLE_RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.title;
    }
  }

  return titleFromFirstLine(normalized) ?? "Meeting Memory";
}
