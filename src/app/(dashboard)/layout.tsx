import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { getOnboardingState } from "@/lib/onboarding/actions";
import { getAuthenticatedUser, listMeetings } from "@/lib/meetings/queries";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const [meetings, onboarding] = await Promise.all([
    listMeetings({ includeArchived: true }),
    getOnboardingState(),
  ]);

  return (
    <AppShell meetings={meetings} onboarding={onboarding}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </AppShell>
  );
}
