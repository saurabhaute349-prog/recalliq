import { countParticipants } from "@/lib/meetings/transcript-utils";
import { generateTitleFromTranscript } from "@/lib/meetings/title";
import { cleanMeetingExportText } from "@/lib/transcripts/parsers/meeting-export";
import type { UploadType } from "@/types/database";

const SPEAKER_LINE = /^([A-Za-z][A-Za-z0-9\s.'-]{0,40}?)\s*[:·]\s*(.*)$/;

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \u00A0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeSpeakerNames(text: string): string {
  const speakerCounts = new Map<string, string>();

  return text
    .split("\n")
    .map((line) => {
      const match = line.match(SPEAKER_LINE);
      if (!match) return line;

      const rawName = match[1].trim();
      const canonical = rawName
        .split(/\s+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");

      const key = rawName.toLowerCase();
      if (!speakerCounts.has(key)) {
        speakerCounts.set(key, canonical);
      }

      const name = speakerCounts.get(key) ?? canonical;
      return `${name}: ${match[2].trim()}`;
    })
    .join("\n");
}

function parseTimestampToSeconds(value: string): number | null {
  const parts = value.replace(",", ".").split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return null;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return null;
}

export function estimateDurationSeconds(text: string): number | null {
  const timestamps: number[] = [];

  const patterns = [
    /\d{1,2}:\d{2}:\d{2}[.,]\d{1,3}/g,
    /\d{1,2}:\d{2}[.,]\d{1,3}/g,
    /\b(\d{1,2}:\d{2}:\d{2})\b/g,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern) ?? [];
    for (const match of matches) {
      const seconds = parseTimestampToSeconds(match);
      if (seconds !== null) timestamps.push(seconds);
    }
  }

  if (timestamps.length < 2) return null;

  const duration = Math.max(...timestamps) - Math.min(...timestamps);
  return duration > 0 ? Math.round(duration) : null;
}

export type PreprocessedTranscript = {
  raw: string;
  cleaned: string;
  title: string;
  participantCount: number;
  durationSeconds: number | null;
};

export function preprocessTranscript(
  rawText: string,
  uploadType: UploadType,
): PreprocessedTranscript {
  let working = rawText;

  if (
    uploadType === "zoom" ||
    uploadType === "meet" ||
    uploadType === "otter" ||
    uploadType === "fireflies" ||
    uploadType === "txt"
  ) {
    working = cleanMeetingExportText(working);
  }

  const raw = normalizeWhitespace(working);
  const cleaned = normalizeSpeakerNames(raw);
  const title = generateTitleFromTranscript(cleaned);
  const participantCount = countParticipants(cleaned);
  const durationSeconds = estimateDurationSeconds(raw);

  return {
    raw,
    cleaned,
    title,
    participantCount,
    durationSeconds,
  };
}
