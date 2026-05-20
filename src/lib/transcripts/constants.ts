import type { UploadType } from "@/types/database";

/** 15 MB for documents and subtitles */
export const MAX_DOCUMENT_UPLOAD_BYTES = 15 * 1024 * 1024;

/** 50 MB for audio (Phase 2 placeholder) */
export const MAX_AUDIO_UPLOAD_BYTES = 50 * 1024 * 1024;

export const AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a"] as const;

export const DOCUMENT_EXTENSIONS = [
  ".txt",
  ".pdf",
  ".docx",
  ".srt",
  ".vtt",
] as const;

export const ALL_UPLOAD_EXTENSIONS = [
  ...DOCUMENT_EXTENSIONS,
  ...AUDIO_EXTENSIONS,
] as const;

export const EXTENSION_TO_UPLOAD_TYPE: Record<string, UploadType> = {
  ".txt": "txt",
  ".pdf": "pdf",
  ".docx": "docx",
  ".srt": "srt",
  ".vtt": "vtt",
  ".mp3": "audio",
  ".wav": "audio",
  ".m4a": "audio",
};

export const ACCEPTED_MIME_TYPES: Record<string, UploadType> = {
  "text/plain": "txt",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/x-subrip": "srt",
  "text/srt": "srt",
  "text/vtt": "vtt",
  "audio/mpeg": "audio",
  "audio/wav": "audio",
  "audio/x-wav": "audio",
  "audio/mp4": "audio",
  "audio/x-m4a": "audio",
};

export const SUPPORTED_FORMAT_LABELS = [
  { label: "Plain text", ext: ".txt" },
  { label: "PDF", ext: ".pdf" },
  { label: "Word", ext: ".docx" },
  { label: "Subtitles", ext: ".srt, .vtt" },
  { label: "Zoom / Meet / Otter / Fireflies", ext: ".txt exports" },
  { label: "Audio (coming soon)", ext: ".mp3, .wav, .m4a" },
] as const;

export const DROPZONE_ACCEPT = {
  "text/plain": [".txt"],
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/x-subrip": [".srt"],
  "text/vtt": [".vtt"],
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/x-wav": [".wav"],
  "audio/mp4": [".m4a"],
  "audio/x-m4a": [".m4a"],
} as const;
