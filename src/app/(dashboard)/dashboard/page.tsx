import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { hasProAccess } from "@/lib/billing/plan";
import { getDashboardStats } from "@/lib/dashboard/stats";
import { getAuthenticatedUser, getUserProfile, listMeetings } from "@/lib/meetings/queries";

export default async function DashboardPage() {
  const { user } = await getAuthenticatedUser();
  const [meetings, profile, stats] = await Promise.all([
    listMeetings(),
    getUserProfile(),
    user ? getDashboardStats(user.id) : Promise.resolve({
      totalMeetings: 0,
      meetingsThisWeek: 0,
      totalAiQuestions: 0,
      topPeople: [],
      recentActionItems: [],
    }),
  ]);

  const meetingsUsed = profile?.meetings_used ?? meetings.length;

  return (
    <DashboardHome
      recentMeetings={meetings.slice(0, 4)}
      continueMeeting={meetings[0] ?? null}
      meetingsUsed={meetingsUsed}
      isPro={hasProAccess(profile)}
      stats={stats}
    />
  );
}
