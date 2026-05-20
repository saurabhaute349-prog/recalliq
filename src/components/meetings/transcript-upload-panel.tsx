"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ClipboardPaste,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isNextRedirectError } from "@/lib/api/errors";
import { createMeeting } from "@/lib/meetings/actions";
import {
  DROPZONE_ACCEPT,
  MAX_DOCUMENT_UPLOAD_BYTES,
  SUPPORTED_FORMAT_LABELS,
} from "@/lib/transcripts/constants";
import { logUploadDev } from "@/lib/transcripts/upload-dev-log";
import type { MeetingCreateMetadata, UploadType } from "@/types/database";
import { cn } from "@/lib/utils";

export type ParsedTranscript = {
  cleaned: string;
  raw: string;
  title: string;
  participantCount: number;
  durationSeconds: number | null;
  uploadType: UploadType | string;
  originalFilename: string;
};

type UploadPhase = "idle" | "parsing" | "success" | "error";

type TranscriptUploadPanelProps = {
  sampleTranscripts: { id: string; label: string; content: string }[];
  placeholder: string;
};

function formatDuration(seconds: number | null): string | null {
  if (seconds == null || seconds <= 0) return null;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function rejectionMessage(rejections: FileRejection[]): string {
  const first = rejections[0];
  if (!first) return "File could not be accepted.";

  const code = first.errors[0]?.code;
  if (code === "file-too-large") {
    return `File is too large. Maximum size is ${formatFileSize(MAX_DOCUMENT_UPLOAD_BYTES)}.`;
  }
  if (code === "file-invalid-type") {
    return "Unsupported format. Use .txt, .pdf, .docx, .srt, or .vtt.";
  }
  return first.errors[0]?.message ?? "File could not be accepted.";
}

export function TranscriptUploadPanel({
  sampleTranscripts,
  placeholder,
}: TranscriptUploadPanelProps) {
  const [transcript, setTranscript] = useState("");
  const [parsedMeta, setParsedMeta] = useState<ParsedTranscript | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parseProgress, setParseProgress] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const charCount = transcript.length;
  const hasContent = transcript.trim().length > 0;
  const isParsing = uploadPhase === "parsing";

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 200), 480)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [transcript, resizeTextarea]);

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  const startProgress = () => {
    setParseProgress(8);
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      setParseProgress((p) => (p >= 92 ? 92 : p + 6));
    }, 180);
  };

  const stopProgress = () => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    setParseProgress(100);
    setTimeout(() => setParseProgress(0), 400);
  };

  const clearUpload = useCallback(() => {
    setUploadedFile(null);
    setParsedMeta(null);
    setShowPreview(false);
    setUploadError(null);
    setUploadPhase("idle");
    logUploadDev("clear");
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setUploadPhase("parsing");
      setUploadError(null);
      setParsedMeta(null);
      setShowPreview(false);
      setUploadedFile(file);
      startProgress();

      logUploadDev("client:start", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/meetings/parse", {
          method: "POST",
          body: formData,
        });

        const data = (await response.json()) as ParsedTranscript & {
          error?: string;
          isAudioPlaceholder?: boolean;
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Could not process this file.");
        }

        if (data.isAudioPlaceholder) {
          toast.info(data.message ?? "Audio transcription coming soon.", {
            duration: 6000,
          });
          setUploadPhase("idle");
          return;
        }

        if (!data.cleaned?.trim()) {
          throw new Error("This file appears empty. Try another transcript.");
        }

        setTranscript(data.cleaned);
        setParsedMeta({
          cleaned: data.cleaned,
          raw: data.raw,
          title: data.title,
          participantCount: data.participantCount,
          durationSeconds: data.durationSeconds,
          uploadType: data.uploadType,
          originalFilename: data.originalFilename,
        });
        setShowPreview(true);
        setUploadPhase("success");

        logUploadDev("client:success", {
          filename: data.originalFilename || file.name,
          cleanedLength: data.cleaned.length,
        });

        toast.success("Transcript extracted", {
          description: `${file.name} is ready to review.`,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed. Try again.";
        setUploadError(message);
        setUploadPhase("error");
        logUploadDev("client:error", { message });
        toast.error(message);
      } finally {
        stopProgress();
      }
    },
    [],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) void processFile(file);
    },
    [processFile],
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const message = rejectionMessage(rejections);
    setUploadError(message);
    setUploadPhase("error");
    logUploadDev("client:rejected", { message });
    toast.error(message);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open, isDragReject } =
    useDropzone({
      onDrop,
      onDropRejected,
      accept: DROPZONE_ACCEPT,
      maxFiles: 1,
      maxSize: MAX_DOCUMENT_UPLOAD_BYTES,
      disabled: isParsing || isCreating,
      noKeyboard: true,
    });

  const handleManualChange = (value: string) => {
    setTranscript(value);
    if (parsedMeta || uploadedFile) {
      setParsedMeta(null);
      setUploadedFile(null);
      setShowPreview(false);
      setUploadPhase("idle");
      setUploadError(null);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast.error("Clipboard is empty.");
        return;
      }
      clearUpload();
      handleManualChange(text);
      logUploadDev("paste:clipboard", { length: text.length });
      toast.success("Pasted from clipboard");
    } catch {
      toast.error("Could not read clipboard. Paste with Ctrl+V instead.");
    }
  };

  const handleCreateMemory = async () => {
    if (!hasContent || isCreating) return;

    setIsCreating(true);
    logUploadDev("create:start", { charCount });

    const metadata: MeetingCreateMetadata | undefined = parsedMeta
      ? {
          title: parsedMeta.title,
          transcriptRaw: parsedMeta.raw,
          originalFilename: parsedMeta.originalFilename,
          uploadType: parsedMeta.uploadType,
          durationSeconds: parsedMeta.durationSeconds,
          participantCount: parsedMeta.participantCount,
        }
      : undefined;

    let result: Awaited<ReturnType<typeof createMeeting>> | undefined;

    try {
      result = await createMeeting(transcript, metadata);
    } catch (error) {
      if (isNextRedirectError(error)) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Could not save this meeting. Please try again.";
      logUploadDev("create:error", { message });
      toast.error(message);
      setIsCreating(false);
      return;
    }

    if (result?.limitReached) {
      toast.error(result.error ?? "Meeting limit reached.", {
        action: {
          label: "View plans",
          onClick: () => {
            window.location.href = "/billing";
          },
        },
      });
      setIsCreating(false);
      return;
    }

    if (result?.error) {
      logUploadDev("create:failed", { error: result.error });
      toast.error(result.error, { duration: 6000 });
      setIsCreating(false);
      return;
    }

    toast.success("Meeting memory saved", {
      description: "Opening your meeting…",
    });
  };

  const previewText = showPreview
    ? transcript.split("\n").slice(0, 12).join("\n")
    : "";
  const durationLabel = formatDuration(parsedMeta?.durationSeconds ?? null);

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className={cn(
          "rounded-2xl border bg-card shadow-sm transition-shadow duration-300",
          isDragActive && "shadow-lg shadow-primary/10",
          uploadPhase === "success" && "border-emerald-500/30",
          uploadPhase === "error" && "border-destructive/40",
        )}
        animate={
          isDragActive
            ? { boxShadow: "0 0 0 1px hsl(var(--primary) / 0.35)" }
            : { boxShadow: "0 0 0 0px transparent" }
        }
      >
        <div
          {...getRootProps()}
          className={cn(
            "relative overflow-hidden rounded-2xl outline-none transition-colors",
            isDragActive && "ring-2 ring-primary/25",
            isDragReject && "ring-2 ring-destructive/30",
          )}
        >
          <input {...getInputProps()} aria-label="Upload transcript file" />
          <AnimatePresence>
            {isDragActive && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-10 bg-primary/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          <motion.div
            className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            animate={
              isDragActive
                ? { opacity: 1, scaleX: 1 }
                : { opacity: 0, scaleX: 0.3 }
            }
            transition={{ duration: 0.35 }}
          />

          <motion.div
            className={cn(
              "border-b border-border px-4 py-3 md:px-6",
              isDragActive && "border-primary/20",
            )}
            animate={isDragActive ? { backgroundColor: "hsl(var(--primary) / 0.04)" } : {}}
          >
            <motion.div
              className="flex flex-wrap items-center justify-between gap-3"
              animate={isDragActive ? { y: -1 } : { y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/50">
                  <FileText className="size-4 text-primary" />
                </span>
                <motion.div
                  animate={isDragActive ? { x: 2 } : { x: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                  <p className="text-sm font-medium">Meeting transcript</p>
                  <p className="text-xs text-muted-foreground">
                    {isDragActive
                      ? "Release to upload"
                      : "Drag & drop, click below, or paste"}
                  </p>
                </motion.div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                disabled={isParsing || isCreating}
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
              >
                {isParsing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                Upload file
              </Button>
            </motion.div>
          </motion.div>

          <div className="p-4 md:p-6">
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  open();
                }
              }}
              className={cn(
                "relative mb-4 cursor-pointer rounded-xl border border-dashed px-4 py-8 text-center transition-all duration-300",
                isDragActive
                  ? "border-primary bg-primary/8 shadow-inner"
                  : isDragReject
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-border/80 bg-muted/20 hover:border-primary/30 hover:bg-muted/30",
              )}
            >
              <motion.div
                animate={
                  isDragActive
                    ? { scale: 1.08, rotate: -4 }
                    : { scale: 1, rotate: 0 }
                }
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              >
                <Upload
                  className={cn(
                    "mx-auto size-9",
                    isDragActive ? "text-primary" : "text-muted-foreground/70",
                  )}
                />
              </motion.div>
              <p className="mt-3 text-sm font-medium">
                {isDragReject
                  ? "Unsupported file"
                  : isDragActive
                    ? "Drop your file here"
                    : "Drag & drop a transcript"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                or click this area · .txt, .pdf, .docx, .srt, .vtt · max{" "}
                {formatFileSize(MAX_DOCUMENT_UPLOAD_BYTES)}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {isParsing && (
                <motion.div
                  key="progress"
                  className="mb-4 space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <motion.div
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  >
                    <Loader2 className="size-4 animate-spin text-primary" />
                    Extracting transcript…
                  </motion.div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${parseProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </motion.div>
              )}

              {uploadedFile && !isParsing && (
                <motion.div
                  key="file-card"
                  className={cn(
                    "mb-4 rounded-xl border px-3 py-3",
                    uploadPhase === "success"
                      ? "border-emerald-500/25 bg-emerald-500/5"
                      : uploadPhase === "error"
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-border bg-muted/30",
                  )}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <motion.div
                    className="flex items-start justify-between gap-2"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      {uploadPhase === "success" ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      ) : uploadPhase === "error" ? (
                        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      ) : (
                        <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                      )}
                      <motion.div
                        className="min-w-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.08 }}
                      >
                        <p className="truncate text-sm font-medium">
                          {uploadedFile.name}
                        </p>
                        <p
                          className="text-xs text-muted-foreground"
                          id="upload-file-status"
                        >
                          {formatFileSize(uploadedFile.size)}
                          {uploadPhase === "success" && " · Ready"}
                          {uploadPhase === "error" && uploadError
                            ? ` · ${uploadError}`
                            : null}
                        </p>
                        {uploadPhase === "error" && uploadedFile ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2 h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              void processFile(uploadedFile);
                            }}
                          >
                            <RefreshCw className="size-3.5" />
                            Retry upload
                          </Button>
                        ) : null}
                      </motion.div>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={isParsing || isCreating}
                        onClick={(e) => {
                          e.stopPropagation();
                          open();
                        }}
                        aria-label="Replace file"
                      >
                        <RefreshCw className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearUpload();
                        }}
                        aria-label="Remove file"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {parsedMeta && showPreview && !isParsing && (
              <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-medium tracking-wide text-primary uppercase">
                  Preview
                </p>
                <p className="mt-1 text-sm font-semibold">{parsedMeta.title}</p>
                <motion.div
                  className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" />
                    {parsedMeta.participantCount} participants
                  </span>
                  {durationLabel && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {durationLabel}
                    </span>
                  )}
                </motion.div>
                <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-xs text-muted-foreground">
                  {previewText}
                </p>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={transcript}
              onChange={(e) => handleManualChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={placeholder}
              disabled={isParsing}
              className="block w-full min-h-[200px] resize-none rounded-xl border border-border/80 bg-muted/20 px-4 py-4 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-primary/20 md:px-5"
              aria-label="Meeting transcript"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {charCount > 0
                  ? `${charCount.toLocaleString()} characters`
                  : "Waiting for transcript"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs"
                disabled={isParsing || isCreating}
                onClick={(e) => {
                  e.stopPropagation();
                  void pasteFromClipboard();
                }}
              >
                <ClipboardPaste className="size-3.5" />
                Paste from clipboard
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="rounded-xl border border-border/80 bg-muted/15 p-4">
        <p className="text-xs font-medium">Supported formats</p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2 text-xs text-muted-foreground">
          {SUPPORTED_FORMAT_LABELS.map((f) => (
            <li key={f.label}>
              {f.label} <span className="font-mono">{f.ext}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex gap-2 text-xs text-muted-foreground">
          <AlertCircle className="size-3.5 shrink-0" />
          Zoom, Meet, Otter, and Fireflies .txt exports supported.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {sampleTranscripts.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={isParsing || isCreating}
            onClick={() => {
              clearUpload();
              setTranscript(s.content);
            }}
            className="rounded-full border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            {s.label}
          </button>
        ))}
      </div>

      <Button
        size="lg"
        className="w-full sm:w-auto"
        disabled={!hasContent || isCreating || isParsing}
        onClick={() => void handleCreateMemory()}
      >
        {isCreating ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        Create Meeting Memory
      </Button>
    </motion.div>
  );
}
