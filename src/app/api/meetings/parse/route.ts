import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/meetings/queries";
import { extractTranscriptFromFile } from "@/lib/transcripts/extract";
import { logUploadDev } from "@/lib/transcripts/upload-dev-log";
import { validateUploadFile } from "@/lib/transcripts/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to upload transcripts." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 },
      );
    }

    const validation = validateUploadFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    if (validation.isAudio) {
      return NextResponse.json({
        isAudioPlaceholder: true,
        message:
          "Transcription processing is coming soon. Upload a text transcript (.txt, .pdf, .docx, .srt, .vtt) for now.",
        originalFilename: file.name,
        uploadType: "audio",
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    logUploadDev("parse:start", {
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    });

    const extracted = await extractTranscriptFromFile({
      buffer,
      filename: file.name,
      mimeType: file.type,
    });

    logUploadDev("parse:success", {
      filename: file.name,
      uploadType: extracted.uploadType,
      cleanedLength: extracted.cleaned.length,
    });

    return NextResponse.json({
      raw: extracted.raw,
      cleaned: extracted.cleaned,
      title: extracted.title,
      participantCount: extracted.participantCount,
      durationSeconds: extracted.durationSeconds,
      uploadType: extracted.uploadType,
      originalFilename: extracted.originalFilename,
      isAudioPlaceholder: false,
    });
  } catch (error) {
    logUploadDev("parse:error", {
      message: error instanceof Error ? error.message : String(error),
    });
    console.error("[meetings/parse]", error);

    const message =
      error instanceof Error
        ? error.message
        : "Could not process this file. Try another format.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
