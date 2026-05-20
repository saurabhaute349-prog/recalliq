"use client";

import { motion } from "framer-motion";
import {
  Check,
  Copy,
  RefreshCw,
  Share2,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { TranscriptCitation } from "@/lib/ai/citations";
import { BRAND } from "@/lib/brand/config";
import { messageEnter } from "@/lib/motion";
import { cn } from "@/lib/utils";

type AssistantMessageProps = {
  children: string;
  isStreaming?: boolean;
  citations?: TranscriptCitation[];
  onCitationClick?: (citation: TranscriptCitation) => void;
  onRegenerate?: () => void;
  onStop?: () => void;
  showStop?: boolean;
};

export function AssistantMessage({
  children,
  isStreaming,
  citations = [],
  onCitationClick,
  onRegenerate,
  onStop,
  showStop,
}: AssistantMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: children,
          title: `${BRAND.name} answer`,
        });
        return;
      } catch {
        // fall through to copy
      }
    }
    await copy();
  };

  const uniqueSpeakers = [
    ...new Set(citations.map((c) => c.speaker).filter(Boolean)),
  ] as string[];

  return (
    <motion.article {...messageEnter} className="group py-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-primary uppercase">
          <Sparkles className="size-3.5" aria-hidden />
          {BRAND.name}
        </p>
        <div className="flex flex-wrap gap-1">
          <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] text-primary">
            Grounded in transcript
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
            AI generated
          </span>
        </div>
      </div>

      {!isStreaming && children ? (
        <p className="mb-3 text-[11px] text-muted-foreground">
          May contain inferred insights beyond the transcript.
        </p>
      ) : null}

      <div
        className={cn(
          "prose prose-sm max-w-none text-muted-foreground dark:prose-invert",
          "prose-p:leading-relaxed prose-li:my-0.5 prose-headings:text-foreground",
          "prose-strong:text-foreground",
        )}
      >
        <ReactMarkdown>{children || (isStreaming ? " " : "")}</ReactMarkdown>
        {isStreaming ? (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
        ) : null}
      </div>

      {citations.length > 0 && !isStreaming ? (
        <div className="mt-4 flex flex-wrap gap-1.5" role="list" aria-label="Sources">
          {citations.map((citation) => (
            <button
              key={citation.id}
              type="button"
              role="listitem"
              onClick={() => onCitationClick?.(citation)}
              className="rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              title={citation.excerpt}
            >
              {citation.speaker ? `[${citation.speaker}]` : citation.lineHint.slice(0, 24)}
            </button>
          ))}
          {uniqueSpeakers.length > 0 ? (
            <span className="self-center text-[10px] text-muted-foreground">
              {citations.length} source{citations.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        {showStop && isStreaming ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={onStop}
          >
            <Square className="size-3" />
            Stop
          </Button>
        ) : null}
        {children && !isStreaming ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => void copy()}
              aria-label="Copy answer"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
            {onRegenerate ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onRegenerate}
                aria-label="Regenerate answer"
              >
                <RefreshCw className="size-3.5" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => void share()}
              aria-label="Share answer"
            >
              <Share2 className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Helpful"
              className={feedback === "up" ? "text-primary" : undefined}
              onClick={() => setFeedback("up")}
            >
              <ThumbsUp className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Not helpful"
              className={feedback === "down" ? "text-destructive" : undefined}
              onClick={() => setFeedback("down")}
            >
              <ThumbsDown className="size-3.5" />
            </Button>
          </>
        ) : null}
      </div>
    </motion.article>
  );
}
