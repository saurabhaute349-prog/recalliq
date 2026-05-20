import { MeetingsLibrary } from "@/components/meetings/meetings-library";
import { hasProAccess } from "@/lib/billing/plan";
import { FREE_PLAN_MEETING_LIMIT } from "@/lib/meetings/constants";
import { getUserProfile, listMeetings } from "@/lib/meetings/queries";

export default async function MeetingsPage() {
  const [meetings, profile] = await Promise.all([
    listMeetings(),
    getUserProfile(),
  ]);

  const meetingsUsed = profile?.meetings_used ?? meetings.length;

  const isPro = hasProAccess(profile);

  return (
    <MeetingsLibrary
      meetings={meetings}
      meetingsUsed={
        isPro ? meetingsUsed : Math.min(meetingsUsed, FREE_PLAN_MEETING_LIMIT)
      }
      isPro={isPro}
    />
  );
}
