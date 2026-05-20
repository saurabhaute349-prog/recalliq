"use client";

import { useState } from "react";
import { Bell, CreditCard, User } from "lucide-react";

import { BillingSettings } from "@/components/settings/billing-settings";
import { NotificationsSettings } from "@/components/settings/notifications-settings";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { SettingsPanelBoundary } from "@/components/settings/settings-panel-boundary";
import { cn } from "@/lib/utils";
import type { UserPreferences } from "@/lib/settings/types";
import type { Profile } from "@/types/database";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

export type SettingsTabId = (typeof TABS)[number]["id"];

type SettingsShellProps = {
  email: string;
  displayName: string | null;
  profile: Profile;
  preferences: UserPreferences;
  meetingsUsed: number;
  aiMessagesUsed: number;
  isPro: boolean;
};

function TabButton({
  item,
  active,
  onSelect,
  layout,
}: {
  item: (typeof TABS)[number];
  active: boolean;
  onSelect: () => void;
  layout: "sidebar" | "mobile";
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg text-sm font-medium transition-colors",
        layout === "sidebar"
          ? "w-full px-3 py-2.5 text-left"
          : "shrink-0 px-3 py-2 text-xs",
        active
          ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {item.label}
    </button>
  );
}

function SettingsPanel({
  tab,
  props,
}: {
  tab: SettingsTabId;
  props: SettingsShellProps;
}) {
  const tabMeta = TABS.find((t) => t.id === tab)!;

  return (
    <SettingsPanelBoundary tabLabel={tabMeta.label}>
      <div
        key={tab}
        className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
      >
        {tab === "profile" && (
          <ProfileSettings
            email={props.email}
            displayName={props.displayName}
            avatarUrl={props.profile.avatar_url ?? null}
            userId={props.profile.id}
            isPro={props.isPro}
            createdAt={props.profile.created_at}
          />
        )}
        {tab === "billing" && (
          <BillingSettings
            profile={props.profile}
            meetingsUsed={props.meetingsUsed}
            aiMessagesUsed={props.aiMessagesUsed}
            isPro={props.isPro}
          />
        )}
        {tab === "notifications" && (
          <NotificationsSettings preferences={props.preferences} />
        )}
      </div>
    </SettingsPanelBoundary>
  );
}

export function SettingsShell(shellProps: SettingsShellProps) {
  const [tab, setTab] = useState<SettingsTabId>("profile");
  const activeMeta = TABS.find((t) => t.id === tab)!;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your Recalliq profile, billing, and notifications.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="lg:hidden space-y-3">
          <label htmlFor="settings-tab-select" className="sr-only">
            Settings section
          </label>
          <select
            id="settings-tab-select"
            value={tab}
            onChange={(e) => setTab(e.target.value as SettingsTabId)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
          >
            {TABS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <nav
            className="flex gap-1 overflow-x-auto rounded-xl border border-border/80 bg-card/60 p-1 backdrop-blur-sm"
            aria-label="Settings sections"
          >
            {TABS.map((item) => (
              <TabButton
                key={item.id}
                item={item}
                active={tab === item.id}
                onSelect={() => setTab(item.id)}
                layout="mobile"
              />
            ))}
          </nav>
        </div>

        <aside className="hidden lg:block lg:w-52 shrink-0">
          <nav
            className="space-y-1 rounded-xl border border-border/80 bg-card/60 p-2 backdrop-blur-sm"
            aria-label="Settings sections"
          >
            {TABS.map((item) => (
              <TabButton
                key={item.id}
                item={item}
                active={tab === item.id}
                onSelect={() => setTab(item.id)}
                layout="sidebar"
              />
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1" aria-label={activeMeta.label}>
          <SettingsPanel tab={tab} props={shellProps} />
        </section>
      </div>
    </div>
  );
}
