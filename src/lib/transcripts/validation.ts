import {
  ALL_UPLOAD_EXTENSIONS,
  AUDIO_EXTENSIONS,
  EXTENSION_TO_UPLOAD_TYPE,
  MAX_AUDIO_UPLOAD_BYTES,
  MAX_DOCUMENT_UPLOAD_BYTES,
} from "@/lib/transcripts/constants";
import type { UploadType } from "@/types/database";

export type FileValidationResult =
  | { ok: true; uploadType: UploadType; isAudio: boolean }
  | { ok: false; error: string };

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "";
  return filename.slice(dot).toLowerCase();
}

export function resolveUploadType(
  filename: string,
  mimeType?: string,
): UploadType | null {
  const ext = getExtension(filename);
  const fromExt = EXTENSION_TO_UPLOAD_TYPE[ext];
  if (fromExt) return fromExt;

  if (mimeType?.startsWith("audio/")) return "audio";

  return null;
}

export function validateUploadFile(file: {
  name: string;
  size: number;
  type: string;
}): FileValidationResult {
  const uploadType = resolveUploadType(file.name, file.type);

  if (!uploadType) {
    return {
      ok: false,
      error: `Unsupported file type. Use: ${ALL_UPLOAD_EXTENSIONS.join(", ")}`,
    };
  }

  const isAudio = AUDIO_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  );

  const maxBytes = isAudio
    ? MAX_AUDIO_UPLOAD_BYTES
    : MAX_DOCUMENT_UPLOAD_BYTES;

  if (file.size === 0) {
    return { ok: false, error: "File is empty. Choose a transcript file." };
  }

  if (file.size > maxBytes) {
    const limitMb = Math.round(maxBytes / (1024 * 1024));
    return {
      ok: false,
      error: `File is too large. Maximum size is ${limitMb} MB.`,
    };
  }

  return { ok: true, uploadType, isAudio };
}
