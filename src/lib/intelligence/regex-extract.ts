import type { IntelligenceActionItem } from "@/types/database";

const SPEAKER_LINE = /^([A-Z][a-zA-Z0-9_.\s-]{0,30}):\s*(.+)$/gm;

const ACTION_PATTERNS = [
  /\b(?:will|need to|going to|should|must)\s+([^.!?\n]{8,120})/gi,
  /\baction(?:\s+item)?:\s*([^.!?\n]+)/gi,
  /\bfollow[\s-]?up:\s*([^.!?\n]+)/gi,
];

const DEADLINE_PATTERNS = [
  /\b(?:by|before|due)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|end of (?:the )?week|eod|tomorrow|friday|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/gi,
  /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi,
];

export function extractSpeakers(transcript: string): string[] {
  const names = new Set<string>();
  let match: RegExpExecArray | null;

  const re = new RegExp(SPEAKER_LINE.source, SPEAKER_LINE.flags);
  while ((match = re.exec(transcript)) !== null) {
    const name = match[1]?.trim();
    if (name && name.length <= 40 && !/^(note|transcript|meeting)$/i.test(name)) {
      names.add(name);
    }
  }

  return [...names].slice(0, 20);
}

export function extractActionItemsHeuristic(transcript: string): IntelligenceActionItem[] {
  const items: IntelligenceActionItem[] = [];
  const seen = new Set<string>();

  for (const pattern of ACTION_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(transcript)) !== null) {
      const task = match[1]?.trim().replace(/\s+/g, " ");
      if (!task || task.length < 8 || seen.has(task.toLowerCase())) continue;
      seen.add(task.toLowerCase());

      const ownerMatch = task.match(/^([A-Z][a-z]+)\s+(?:will|to)\s+/);
      items.push({
        task: task.slice(0, 200),
        owner: ownerMatch?.[1] ?? null,
        deadline: null,
      });
    }
  }

  return items.slice(0, 12);
}

export function extractDeadlinesHeuristic(transcript: string): string[] {
  const deadlines = new Set<string>();

  for (const pattern of DEADLINE_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(transcript)) !== null) {
      deadlines.add(match[0].trim().slice(0, 80));
    }
  }

  return [...deadlines].slice(0, 10);
}

export function extractBlockersHeuristic(transcript: string): string[] {
  const blockers: string[] = [];
  const lines = transcript.split("\n");

  for (const line of lines) {
    if (/\b(blocker|blocked|stuck|impediment|risk|issue)\b/i.test(line)) {
      const trimmed = line.trim().slice(0, 160);
      if (trimmed.length > 12) blockers.push(trimmed);
    }
  }

  return blockers.slice(0, 8);
}
