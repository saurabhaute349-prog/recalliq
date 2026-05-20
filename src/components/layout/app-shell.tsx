"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import dynamic from "next/dynamic";

const CommandPalette = dynamic(
  () =>
    import("@/components/command/command-palette").then((m) => ({
      default: m.CommandPalette,
    })),
  { ssr: false },
);
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { markOnboardingStep } from "@/lib/onboarding/actions";
import type {
  OnboardingChecklistKey,
  OnboardingProgress,
  OnboardingStep,
} from "@/lib/onboarding/types";
import type { MeetingListItem } from "@/types/database";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/meetings": "Meetings",
  "/search": "Search",
  "/billing": "Billing",
  "/settings": "Settings",
  "/new": "New",
};

function getPageTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const match = Object.entries(pageTitles).find(([href]) =>
    pathname.startsWith(`${href}/`),
  );
  return match?.[1] ?? "Dashboard";
}

function checklistKeyForPath(pathname: string): OnboardingChecklistKey | null {
  if (pathname.startsWith("/search")) return "openSearch";
  if (pathname === "/dashboard") return "visitDashboard";
  if (pathname.startsWith("/billing")) return "visitBilling";
  return null;
}

type AppShellProps = {
  children: ReactNode;
  className?: string;
  meetings?: MeetingListItem[];
  onboarding?: {
    completed: boolean;
    step: OnboardingStep;
    progress: OnboardingProgress;
    dismissed: boolean;
  } | null;
};

export function AppShell({
  children,
  className,
  meetings = [],
  onboarding = null,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const trackedStepsRef = useRef<Set<OnboardingChecklistKey>>(new Set());

  const title = useMemo(() => getPageTitle(pathname), [pathname]);

  const showOnboarding =
    onboarding && !onboarding.completed && !onboarding.dismissed;

  useEffect(() => {
    if (showOnboarding) setOnboardingOpen(true);
  }, [showOnboarding]);

  const visitDashboardDone = onboarding?.progress.visitDashboard === true;
  const openSearchDone = onboarding?.progress.openSearch === true;
  const visitBillingDone = onboarding?.progress.visitBilling === true;

  useEffect(() => {
    if (!onboarding || onboarding.completed) return;

    const key = checklistKeyForPath(pathname);
    if (!key) return;

    if (onboarding.progress[key] === true) return;
    if (trackedStepsRef.current.has(key)) return;

    trackedStepsRef.current.add(key);

    void markOnboardingStep(key).then((result) => {
      if (!result.ok) {
        trackedStepsRef.current.delete(key);
      }
    });
  }, [
    pathname,
    onboarding?.completed,
    visitDashboardDone,
    openSearchDone,
    visitBillingDone,
  ]);

  return (
    <div className={cn("flex min-h-screen bg-background", className)}>
      <Sidebar onOpenCommand={() => setCommandOpen(true)} />

      <MobileSidebar
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        onOpenCommand={() => setCommandOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
          onOpenCommand={() => setCommandOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8 lg:px-10">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette
        meetings={meetings}
        open={commandOpen}
        onOpenChange={setCommandOpen}
      />

      {onboarding && (
        <OnboardingWizard
          open={onboardingOpen}
          onOpenChange={setOnboardingOpen}
          step={onboarding.step}
          progress={onboarding.progress}
        />
      )}
    </div>
  );
}
