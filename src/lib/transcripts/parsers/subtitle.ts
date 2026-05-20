/** Strip SRT/VTT timestamps and cues; keep dialogue text. */

function stripVttHeader(text: string): string {
  return text.replace(/^WEBVTT[^\n]*\n/i, "").trim();
}

function isTimestampLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^\d+$/.test(trimmed)) return true;
  if (
    /^\d{1,2}:\d{2}:\d{2}[.,]\d{3}\s*-->/.test(trimmed) ||
    /^\d{1,2}:\d{2}[.,]\d{3}\s*-->/.test(trimmed)
  ) {
    return true;
  }
  if (/^NOTE\b/i.test(trimmed) || /^STYLE\b/i.test(trimmed)) return true;
  return false;
}

export function parseSubtitleText(raw: string, format: "srt" | "vtt"): string {
  let text = raw.replace(/\uFEFF/g, "").trim();
  if (format === "vtt") {
    text = stripVttHeader(text);
  }

  const lines = text.split(/\r?\n/);
  const dialogue: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (isTimestampLine(trimmed)) continue;
    if (/^WEBVTT/i.test(trimmed)) continue;
    dialogue.push(trimmed);
  }

  return dialogue.join("\n");
}
