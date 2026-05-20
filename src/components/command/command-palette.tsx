"use client";

import {
  CreditCard,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { logCommandDev } from "@/lib/command/command-dev-log";
import { rankByFuzzy } from "@/lib/command/fuzzy";
import { cn } from "@/lib/utils";
import type { MeetingListItem } from "@/types/database";

const RECENT_MEETINGS_KEY = "meetingmind-recent-opened";
const MAX_RECENT = 6;

type CommandAction = {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Search;
  href: string;
};

const QUICK_ACTIONS: CommandAction[] = [
  { id: "new", label: "New meeting", hint: "Upload or paste transcript", icon: Plus, href: "/new" },
  { id: "dashboard", label: "Open dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "meetings", label: "All meetings", icon: Video, href: "/meetings" },
  { id: "search", label: "Search memory", icon: Search, href: "/search" },
  { id: "billing", label: "Billing", icon: CreditCard, href: "/billing" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

function loadRecentIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_MEETINGS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function pushRecentMeeting(meetingId: string) {
  const next = [meetingId, ...loadRecentIds().filter((id) => id !== meetingId)].slice(
    0,
    MAX_RECENT,
  );
  localStorage.setItem(RECENT_MEETINGS_KEY, JSON.stringify(next));
}

type CommandPaletteProps = {
  meetings: MeetingListItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({
  meetings,
  open,
  onOpenChange,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const recentMeetings = useMemo(() => {
    const ids = loadRecentIds();
    return ids
      .map((id) => meetings.find((m) => m.id === id))
      .filter((m): m is MeetingListItem => Boolean(m));
  }, [meetings]);

  const filteredMeetings = useMemo(
    () =>
      rankByFuzzy(
        meetings.filter((m) => !m.archived),
        query,
        (m) => `${m.title} ${m.summary ?? ""}`,
      ).slice(0, 8),
    [meetings, query],
  );

  const filteredActions = useMemo(
    () =>
      rankByFuzzy(QUICK_ACTIONS, query, (a) => `${a.label} ${a.hint ?? ""}`),
    [query],
  );

  const items = useMemo(() => {
    const rows: { type: "action" | "meeting"; id: string; href: string }[] = [];

    for (const action of filteredActions) {
      rows.push({ type: "action", id: action.id, href: action.href });
    }

    const meetingList = query.trim() ? filteredMeetings : recentMeetings.length > 0 ? recentMeetings : meetings.slice(0, 5);

    for (const meeting of meetingList) {
      rows.push({ type: "meeting", id: meeting.id, href: `/meetings/${meeting.id}` });
    }

    return rows;
  }, [filteredActions, filteredMeetings, recentMeetings, meetings, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      logCommandDev("open");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const navigate = useCallback(
    (href: string, meetingId?: string) => {
      if (meetingId) pushRecentMeeting(meetingId);
      logCommandDev("navigate", { href });
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
        return;
      }

      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && items[activeIndex]) {
        e.preventDefault();
        const item = items[activeIndex];
        navigate(item.href, item.type === "meeting" ? item.id : undefined);
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, items, navigate, onOpenChange, open]);

  let rowIndex = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-xl"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>
            Search meetings and jump to pages. Use arrow keys and Enter.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-border px-4 py-3">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search meetings or type a command…"
            className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            aria-label="Command search"
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            <kbd className="rounded border px-1">↑↓</kbd> navigate ·{" "}
            <kbd className="rounded border px-1">↵</kbd> open ·{" "}
            <kbd className="rounded border px-1">esc</kbd> close
          </p>
        </div>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {filteredActions.length > 0 && (
            <section className="mb-2">
              <p className="px-2 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Quick actions
              </p>
              <ul>
                {filteredActions.map((action) => {
                  rowIndex += 1;
                  const idx = rowIndex;
                  const Icon = action.icon;
                  return (
                    <li key={action.id}>
                      <button
                        type="button"
                        onClick={() => navigate(action.href)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                          activeIndex === idx
                            ? "bg-primary/10 text-foreground"
                            : "hover:bg-muted/60",
                        )}
                      >
                        <Icon className="size-4 shrink-0 text-primary" />
                        <span className="flex-1 font-medium">{action.label}</span>
                        {action.hint ? (
                          <span className="text-xs text-muted-foreground">{action.hint}</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section>
            <p className="px-2 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {query.trim() ? "Meetings" : "Recent meetings"}
            </p>
            {items.filter((i) => i.type === "meeting").length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No meetings found.
              </p>
            ) : (
              <ul>
                {(query.trim() ? filteredMeetings : recentMeetings.length > 0 ? recentMeetings : meetings.slice(0, 5)).map((meeting) => {
                  rowIndex += 1;
                  const idx = rowIndex;
                  return (
                    <li key={meeting.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/meetings/${meeting.id}`, meeting.id)}
                        className={cn(
                          "flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                          activeIndex === idx
                            ? "bg-primary/10"
                            : "hover:bg-muted/60",
                        )}
                      >
                        <span className="text-sm font-medium">{meeting.title}</span>
                        {meeting.summary ? (
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {meeting.summary}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
