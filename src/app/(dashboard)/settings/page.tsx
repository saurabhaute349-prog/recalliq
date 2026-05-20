import Link from "next/link";
import { redirect } from "next/navigation";

import { SettingsShell } from "@/components/settings/settings-shell";
import { Button } from "@/components/ui/button";
import { hasProAccess } from "@/lib/billing/plan";
import { FREE_PLAN_MEETING_LIMIT } from "@/lib/meetings/constants";
import { loadSettingsData } from "@/lib/settings/queries";

export default async function SettingsPage() {
  const data = await loadSettingsData();

  if (!data) {
    const { getAuthenticatedUser } = await import("@/lib/meetings/queries");
    const { user } = await getAuthenticatedUser();
    if (!user) {
      redirect("/login");
    }

    return (
      <div
        className="mx-auto max-w-lg space-y-4 rounded-xl border border-border bg-card/80 p-8 text-center backdrop-blur-sm"
        role="alert"
      >
        <h2 className="text-lg font-semibold">Could not load settings</h2>
        <p className="text-sm text-muted-foreground">
          Your profile could not be loaded. Try refreshing, or sign in again.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { user, profile, preferences, aiMessagesUsed } = data;
  const isPro = hasProAccess(profile);
  const meetingsUsed = profile.meetings_used ?? 0;

  return (
    <SettingsShell
      email={user.email ?? ""}
      displayName={
        profile.full_name ??
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null
      }
      profile={profile}
      preferences={preferences}
      meetingsUsed={
        isPro ? meetingsUsed : Math.min(meetingsUsed, FREE_PLAN_MEETING_LIMIT)
      }
      aiMessagesUsed={aiMessagesUsed}
      isPro={isPro}
    />
  );
}
