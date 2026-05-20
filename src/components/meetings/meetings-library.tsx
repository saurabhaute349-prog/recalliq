"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/premium/empty-state";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { FREE_PLAN_MEETING_LIMIT } from "@/lib/meetings/constants";
import { MeetingsOrgBar } from "@/components/meetings/meetings-org-bar";
import { deleteMeeting, renameMeeting } from "@/lib/meetings/actions";
import {
  getCategoryLabel,
  getCategoryStyle,
  type MeetingOrgFilter,
} from "@/lib/meetings/organization";
import {
  toggleMeetingArchived,
  toggleMeetingFavorite,
  toggleMeetingPinned,
} from "@/lib/meetings/organization-actions";
import { RelativeTime } from "@/components/shared/relative-time";
import { isRecentMeeting } from "@/lib/meetings/format";
import { fadeIn, fadeInDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { MeetingListItem } from "@/types/database";

const filters = [
  { id: "all", label: "All" },
  { id: "recent", label: "Recent" },
  { id: "team", label: "Team" },
  { id: "personal", label: "Personal" },
] as const;

type MeetingsLibraryProps = {
  meetings: MeetingListItem[];
  meetingsUsed: number;
  isPro: boolean;
};

function MeetingCard({
  meeting,
  index,
}: {
  meeting: MeetingListItem;
  index: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState(meeting.title);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleRename = () => {
    startTransition(async () => {
      const result = await renameMeeting(meeting.id, renameTitle);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Meeting renamed");
      setRenameOpen(false);
      router.refresh();
    });
  };

  const togglePin = () => {
    startTransition(async () => {
      await toggleMeetingPinned(meeting.id, !meeting.pinned);
      toast.success(meeting.pinned ? "Unpinned" : "Pinned");
      router.refresh();
    });
  };

  const toggleFavorite = () => {
    startTransition(async () => {
      await toggleMeetingFavorite(meeting.id, !meeting.favorite);
      toast.success(meeting.favorite ? "Removed from favorites" : "Added to favorites");
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteMeeting(meeting.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Meeting deleted");
      setDeleteOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <motion.div key={meeting.id} {...fadeInDelay(0.04 * index)}>
        <div className="group relative flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-border hover:bg-muted/20 hover:shadow-md">
          <div className="absolute top-3 right-3 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                  aria-label="Meeting options"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={togglePin}>
                  <Pin className="size-4" />
                  {meeting.pinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleFavorite}>
                  <Star className="size-4" />
                  {meeting.favorite ? "Unfavorite" : "Favorite"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setRenameTitle(meeting.title);
                    setRenameOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link href={`/meetings/${meeting.id}`} className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-3 pr-8">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium tracking-tight text-foreground transition-colors group-hover:text-primary">
                  {meeting.title}
                </h3>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <RelativeTime isoDate={meeting.created_at} />
                  {meeting.category ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        getCategoryStyle(meeting.category),
                      )}
                    >
                      {getCategoryLabel(meeting.category)}
                    </span>
                  ) : null}
                  {meeting.is_demo ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      Demo
                    </span>
                  ) : null}
                </p>
              </div>
              <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </div>

            <p className="mt-4 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {meeting.summary}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/80 pt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" />
                {meeting.participant_count}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="size-3.5" />
                {meeting.message_count} messages
              </span>
              {meeting.message_count > 0 && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Memory active
                </span>
              )}
            </div>
          </Link>
        </div>
      </motion.div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename meeting</DialogTitle>
          </DialogHeader>
          <Input
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            placeholder="Meeting title"
            disabled={isPending}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete meeting?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes the transcript and all AI messages. This cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MeetingsLibrary({
  meetings,
  meetingsUsed,
  isPro,
}: MeetingsLibraryProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<(typeof filters)[number]["id"]>("all");
  const [orgFilter, setOrgFilter] = useState<MeetingOrgFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filteredMeetings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return meetings.filter((meeting) => {
      const archived = meeting.archived ?? false;
      const pinned = meeting.pinned ?? false;
      const favorite = meeting.favorite ?? false;

      if (orgFilter === "archived") {
        if (!archived) return false;
      } else if (archived) {
        return false;
      }

      if (orgFilter === "pinned" && !pinned) return false;
      if (orgFilter === "favorites" && !favorite) return false;

      if (categoryFilter && meeting.category !== categoryFilter) return false;

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "recent" && isRecentMeeting(meeting.created_at)) ||
        activeFilter === "team" ||
        activeFilter === "personal";

      const matchesSearch =
        !query ||
        meeting.title.toLowerCase().includes(query) ||
        (meeting.summary ?? "").toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [meetings, search, activeFilter, orgFilter, categoryFilter]);

  const showEmpty = meetings.length === 0;
  const showNoResults = !showEmpty && filteredMeetings.length === 0;

  return (
    <motion.div className="space-y-10 md:space-y-12">
      <motion.header
        {...fadeIn}
        className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Meeting memory
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            All your meetings are now searchable memory. Open any thread to ask
            questions grounded in what was said.
          </p>
        </div>
        <Button className="h-9 shrink-0" asChild>
          <Link href="/new">
            <Plus className="size-4" />
            New meeting
          </Link>
        </Button>
      </motion.header>

      <MeetingsOrgBar
        orgFilter={orgFilter}
        onOrgFilterChange={setOrgFilter}
        category={categoryFilter}
        onCategoryChange={setCategoryFilter}
      />

      <motion.section
        {...fadeInDelay(0.05)}
        className="space-y-4"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings, topics, or peopleâ€¦"
            className="h-10 border-border bg-card pl-9 shadow-sm"
            aria-label="Search meeting memory"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                activeFilter === filter.id
                  ? "border-primary/30 bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </motion.section>

      <motion.div
        {...fadeInDelay(0.08)}
        className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3.5"
      >
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">
            Your meetings become searchable AI memory.
          </span>{" "}
          Every transcript you add stays linked to its conversationâ€”ask about
          action items, decisions, or owners anytime.
        </p>
      </motion.div>

      {showEmpty ? (
        <EmptyState
          icon={Brain}
          title="No meetings yet"
          description="Paste your first transcript and Recalliq will turn it into memory you can question later."
          action={
            <Button className="h-9" asChild>
              <Link href="/new">
                <Plus className="size-4" />
                Create first meeting
              </Link>
            </Button>
          }
        />
      ) : showNoResults ? (
        <EmptyState
          icon={Brain}
          title="No matches"
          description="No meetings match your search. Try another term or filter."
        />
      ) : (
        <motion.section {...fadeIn} className="grid gap-3 sm:grid-cols-2">
          {filteredMeetings.map((meeting, index) => (
            <MeetingCard key={meeting.id} meeting={meeting} index={index} />
          ))}
        </motion.section>
      )}

      <motion.footer
        {...fadeInDelay(0.12)}
        className="border-t border-border pt-8"
      >
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:max-w-sm">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {isPro ? "Pro plan" : "Free plan"}
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight">
            {isPro ? (
              "Unlimited meetings"
            ) : (
              <>
                {meetingsUsed}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {FREE_PLAN_MEETING_LIMIT} meetings
                </span>
              </>
            )}
          </p>
          {!isPro && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${Math.min((meetingsUsed / FREE_PLAN_MEETING_LIMIT) * 100, 100)}%`,
              }}
            />
          </div>
          )}
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {isPro
              ? "Unlimited AI on every meeting memory."
              : "Upgrade for unlimited memory when you need more space."}
          </p>
          {!isPro && (
          <Link
            href="/billing"
            className="mt-2 inline-block text-xs font-medium text-foreground underline-offset-4 hover:underline"
          >
            Upgrade to Pro
          </Link>
          )}
        </div>
      </motion.footer>
    </motion.div>
  );
}
