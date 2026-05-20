const DEFAULT_CHIPS = [
  "Who owns the next steps?",
  "What deadlines were mentioned?",
  "Summarize blockers and risks",
] as const;

export function generateFollowUpSuggestions(
  answer: string,
  _transcript: string,
): string[] {
  const text = answer.toLowerCase();
  const chips: string[] = [];

  if (/action|task|todo|follow[- ]?up|own/i.test(text)) {
    chips.push("Who owns each action item?");
  } else {
    chips.push("What were the action items?");
  }

  if (/deadline|due|date|week|month|timeline/i.test(text)) {
    chips.push("What deadlines were mentioned?");
  } else {
    chips.push("When are the key dates?");
  }

  if (/blocker|risk|issue|concern|delay|stuck/i.test(text)) {
    chips.push("Summarize blockers discussed");
  } else if (/decision|agreed|decided/i.test(text)) {
    chips.push("What decisions were made?");
  } else {
    chips.push("Summarize blockers and risks");
  }

  const unique = [...new Set(chips)];
  while (unique.length < 3) {
    const fallback = DEFAULT_CHIPS[unique.length];
    if (fallback && !unique.includes(fallback)) unique.push(fallback);
    else break;
  }

  return unique.slice(0, 3);
}
