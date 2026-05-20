"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TranscriptPanelProps = {
  transcript: string;
  highlightExcerpt?: string | null;
  forceOpen?: boolean;
};

function TranscriptPanelInner({
  transcript,
  highlightExcerpt,
  forceOpen,
}: TranscriptPanelProps) {
  const [open, setOpen] = useState(false);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const [query, setQuery] = useState("");
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);

  const speakers = useMemo(() => {
    const names = new Set<string>();
    for (const line of transcript.split("\n")) {
      const match = line.match(/^([A-Z][a-zA-Z0-9_.\s-]{0,30}):\s/);
      if (match?.[1]) names.add(match[1].trim());
    }
    return [...names];
  }, [transcript]);

  const filteredLines = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transcript.split("\n").filter((line) => {
      if (activeSpeaker && !line.startsWith(`${activeSpeaker}:`)) return false;
      if (!q) return true;
      return line.toLowerCase().includes(q);
    });
  }, [transcript, query, activeSpeaker]);

  useEffect(() => {
    if (forceOpen || highlightExcerpt) {
      setOpen(true);
    }
  }, [forceOpen, highlightExcerpt]);

  useEffect(() => {
    if (!highlightExcerpt || !open) return;
    highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightExcerpt, open, filteredLines]);

  const renderLine = (line: string, index: number) => {
    const isHighlight =
      highlightExcerpt &&
      line.toLowerCase().includes(highlightExcerpt.toLowerCase().slice(0, 40));

    if (isHighlight) {
      return (
        <span
          key={`${index}-${line.slice(0, 12)}`}
          ref={highlightRef}
          className="block rounded bg-primary/15 px-1 text-foreground ring-1 ring-primary/30"
        >
          {line}
        </span>
      );
    }

    return <span key={`${index}-${line.slice(0, 12)}`} className="block">{line}</span>;
  };

  return (
    <section className="max-w-full shrink-0 overflow-x-hidden border-b border-border py-3 sm:py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-muted/40"
      >
        <span className="text-sm font-medium">Transcript context</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search transcript…"
                  className="h-9 pl-9 text-xs"
                  aria-label="Search within transcript"
                />
              </div>

              {speakers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveSpeaker(null)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px]",
                      !activeSpeaker
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    All
                  </button>
                  {speakers.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() =>
                        setActiveSpeaker((current) =>
                          current === name ? null : name,
                        )
                      }
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[11px]",
                        activeSpeaker === name
                          ? "border-primary/30 bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              <pre className="max-h-56 overflow-y-auto rounded-xl border border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {filteredLines.length > 0
                  ? filteredLines.map((line, index) => renderLine(line, index))
                  : "No matching lines."}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <p className="mt-2 line-clamp-2 font-mono text-xs leading-relaxed text-muted-foreground">
          {transcript.split("\n").slice(0, 3).join("\n")}…
        </p>
      )}
    </section>
  );
}

export const TranscriptPanel = memo(TranscriptPanelInner);
