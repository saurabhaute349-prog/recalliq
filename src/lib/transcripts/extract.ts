import "server-only";

import { BRAND } from "@/lib/brand/config";
import { MIN_TRANSCRIPT_LENGTH } from "@/lib/meetings/constants";
import { extractDocxText } from "@/lib/transcripts/parsers/docx";
import {
  cleanMeetingExportText,
  detectMeetingExportType,
} from "@/lib/transcripts/parsers/meeting-export";
import { extractPdfText } from "@/lib/transcripts/parsers/pdf";
import { parseSubtitleText } from "@/lib/transcripts/parsers/subtitle";
import { preprocessTranscript } from "@/lib/transcripts/preprocess";
import { resolveUploadType } from "@/lib/transcripts/validation";
import type { UploadType } from "@/types/database";

export type ExtractedTranscript = {
  raw: string;
  cleaned: string;
  title: string;
  participantCount: number;
  durationSeconds: number | null;
  uploadType: UploadType;
  originalFilename: string;
  isAudioPlaceholder: boolean;
};

export async function extractTranscriptFromFile(input: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}): Promise<ExtractedTranscript> {
  const { buffer, filename, mimeType } = input;
  let uploadType = resolveUploadType(filename, mimeType);

  if (!uploadType) {
    throw new Error("Unsupported file type.");
  }

  if (uploadType === "audio") {
    return {
      raw: "",
      cleaned: "",
      title: filename.replace(/\.[^.]+$/, ""),
      participantCount: 0,
      durationSeconds: null,
      uploadType: "audio",
      originalFilename: filename,
      isAudioPlaceholder: true,
    };
  }

  let rawText = "";

  switch (uploadType) {
    case "txt": {
      rawText = buffer.toString("utf-8");
      const exportType = detectMeetingExportType(filename, rawText);
      if (exportType) uploadType = exportType;
      break;
    }
    case "pdf":
      rawText = await extractPdfText(buffer);
      break;
    case "docx":
      rawText = await extractDocxText(buffer);
      break;
    case "srt":
      rawText = parseSubtitleText(buffer.toString("utf-8"), "srt");
      break;
    case "vtt":
      rawText = parseSubtitleText(buffer.toString("utf-8"), "vtt");
      break;
    default:
      rawText = buffer.toString("utf-8");
  }

  if (uploadType === "txt") {
    rawText = cleanMeetingExportText(rawText);
  }

  const preprocessed = preprocessTranscript(rawText, uploadType);

  if (preprocessed.cleaned.length < MIN_TRANSCRIPT_LENGTH) {
    throw new Error(
      "Not enough transcript text found. Try a longer file or paste manually.",
    );
  }

  return {
    ...preprocessed,
    uploadType,
    originalFilename: filename,
    isAudioPlaceholder: false,
  };
}

export function preprocessPastedTranscript(text: string): ExtractedTranscript {
  const preprocessed = preprocessTranscript(text, "paste");

  if (preprocessed.cleaned.length < MIN_TRANSCRIPT_LENGTH) {
    throw new Error(
      `Please paste a longer transcript so ${BRAND.name} can build memory.`,
    );
  }

  return {
    ...preprocessed,
    uploadType: "paste",
    originalFilename: "pasted-transcript.txt",
    isAudioPlaceholder: false,
  };
}
