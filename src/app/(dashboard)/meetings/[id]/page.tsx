import Link from "next/link";
import { Brain } from "lucide-react";

import { MeetingDetailView } from "@/components/meetings/meeting-detail-view";
import { Button } from "@/components/ui/button";
import { hasProAccess } from "@/lib/billing/plan";
import { countUserMessages } from "@/lib/meetings/chat-service";
import { getMeetingIntelligence } from "@/lib/intelligence/queries";
import { buildSuggestedQuestions } from "@/lib/intelligence/suggestions";
import {
  getAuthenticatedUser,
  getMeetingById,
  getUserProfile,
  listChatMessages,
} from "@/lib/meetings/queries";

type MeetingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = await params;
  const { user } = await getAuthenticatedUser();
  const [meeting, messages, profile, intelligence] = await Promise.all([
    getMeetingById(id),
    listChatMessages(id),
    getUserProfile(),
    user ? getMeetingIntelligence(id, user.id) : Promise.resolve(null),
  ]);

  const suggestedQuestions = buildSuggestedQuestions(intelligence);

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted/40">
          <Brain className="size-6 text-primary" />
        </span>
        <h2 className="mt-6 text-xl font-semibold tracking-tight">
          Meeting not found
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This memory may have been deleted or you do not have access to it.
        </p>
        <Button className="mt-6 h-9" asChild>
          <Link href="/meetings">Back to meetings</Link>
        </Button>
      </div>
    );
  }

  const userMessageCount = countUserMessages(messages);

  return (
    <div className="-mx-4 flex min-h-[calc(100dvh-4rem)] flex-col overflow-hidden sm:-mx-0 md:min-h-0">
      <MeetingDetailView
        meeting={meeting}
        initialMessages={messages}
        userMessageCount={userMessageCount}
        isPro={hasProAccess(profile)}
        suggestedQuestions={suggestedQuestions}
      />
    </div>
  );
}
