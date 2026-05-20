export function countParticipants(transcript: string): number {
  const names = new Set<string>();

  for (const line of transcript.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^([A-Za-z][A-Za-z\s.'-]{0,40}?)\s*[:·]/);
    if (match?.[1]) {
      names.add(match[1].trim());
    }
  }

  return Math.max(names.size, 1);
}

export function buildSummaryPreview(transcript: string, maxLength = 200): string {
  const normalized = transcript.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "Meeting transcript saved. Ask questions to explore this memory.";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}…`;
}
