"use client";

import { motion } from "framer-motion";
import { AlertCircle, Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/premium/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { RelativeTime } from "@/components/shared/relative-time";
import { fadeIn, fadeInDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { MeetingSearchHit } from "@/lib/meetings/search";

const RECENT_KEY = "meetingmind-recent-searches";
const MAX_RECENT = 8;
const DEBOUNCE_MS = 320;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  const trimmed = term.trim();
  if (!trimmed) return;
  const next = [
    trimmed,
    ...loadRecent().filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

function SnippetText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <mark
              key={index}
              className="rounded-sm bg-primary/15 px-0.5 font-medium text-foreground"
            >
              {part.slice(2, -2)}
            </mark>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
}

export function SearchView() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<MeetingSearchHit[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const runSearch = useCallback(async (term: string) => {
    if (!term) {
      setResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/meetings/search?q=${encodeURIComponent(term)}`,
      );
      const payload = (await response.json()) as {
        ok?: boolean;
        data?: { results: MeetingSearchHit[] };
        error?: string;
        results?: MeetingSearchHit[];
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Search failed. Please try again.");
      }

      const hits =
        payload.data?.results ?? payload.results ?? ([] as MeetingSearchHit[]);
      setResults(hits);
      saveRecent(term);
      setRecent(loadRecent());
    } catch (err) {
      setResults([]);
      setError(
        err instanceof Error ? err.message : "Search failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void runSearch(debounced);
  }, [debounced, runSearch]);

  const showEmpty = !debounced && results.length === 0;
  const showNoResults = debounced && !isLoading && results.length === 0 && !error;

  const sortedResults = useMemo(
    () => [...results].sort((a, b) => b.rank - a.rank),
    [results],
  );

  return (
    <motion.div className="mx-auto w-full max-w-3xl space-y-8">
      <motion.header {...fadeIn} className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Search memory
        </h2>
        <p
          id="search-page-desc"
          className="text-sm text-muted-foreground md:text-base"
        >
          Find meetings by title, summary, or transcript content.
        </p>
      </motion.header>

      <motion.div {...fadeInDelay(0.05)} className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles, summaries, transcripts…"
          className="h-11 border-border bg-card pl-9 pr-10 shadow-sm"
          aria-label="Search meetings"
          aria-describedby="search-page-desc"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </motion.div>

      {recent.length > 0 && showEmpty && (
        <motion.section {...fadeInDelay(0.08)} className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Recent searches
          </p>
          <motion.div className="flex flex-wrap gap-2">
            {recent.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                {term}
              </button>
            ))}
          </motion.div>
        </motion.section>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Searching…
        </div>
      )}

      {error && (
        <ErrorState
          icon={AlertCircle}
          title="Search failed"
          description={error}
          onRetry={() => void runSearch(debounced)}
        />
      )}

      {showEmpty && !isLoading && !error && (
        <EmptyState
          icon={Search}
          title="Search your meeting memory"
          description="Type a keyword to find decisions, action items, and quotes across every transcript."
        />
      )}

      {showNoResults && !error && (
        <EmptyState
          icon={Search}
          title="No results"
          description={`Nothing matched "${debounced}". Try different keywords or a speaker name.`}
        />
      )}

      {sortedResults.length > 0 && (
        <motion.ul {...fadeIn} className="space-y-3">
          {sortedResults.map((meeting, index) => (
            <motion.li key={meeting.id} {...fadeInDelay(0.03 * index)}>
              <Link
                href={`/meetings/${meeting.id}`}
                className={cn(
                  "block rounded-xl border border-border bg-card p-5 shadow-sm transition-colors",
                  "hover:border-primary/20 hover:bg-muted/20",
                )}
              >
                <motion.div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium text-foreground">
                      {meeting.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <RelativeTime isoDate={meeting.created_at} />
                    </p>
                  </div>
                </motion.div>
                <SnippetText text={meeting.snippet} />
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </motion.div>
  );
}
