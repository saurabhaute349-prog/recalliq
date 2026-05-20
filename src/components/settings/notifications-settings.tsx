"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateUserPreferences } from "@/lib/settings/actions";
import type { UserPreferences } from "@/lib/settings/types";

type NotificationsSettingsProps = {
  preferences: UserPreferences;
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-border/80 bg-muted/15 p-3 transition-colors hover:bg-muted/25">
      <span>
        <span className="text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 shrink-0 rounded border-border"
        aria-label={label}
      />
    </label>
  );
}

export function NotificationsSettings({
  preferences,
}: NotificationsSettingsProps) {
  const n = preferences.notifications;
  const [productUpdates, setProductUpdates] = useState(
    n?.productUpdates ?? true,
  );
  const [aiTips, setAiTips] = useState(n?.aiTips ?? true);
  const [billingEmails, setBillingEmails] = useState(n?.billingEmails ?? true);
  const [meetingReminders, setMeetingReminders] = useState(
    n?.meetingReminders ?? true,
  );
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const result = await updateUserPreferences({
        notifications: {
          productUpdates,
          aiTips,
          billingEmails,
          meetingReminders,
        },
      });
      if (result.ok) toast.success("Notification preferences saved");
      else toast.error(result.error ?? "Could not save");
    });
  };

  return (
    <section className="space-y-6 rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      <div>
        <h3 className="text-sm font-medium">Notifications</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Control which emails you receive from Recalliq.
        </p>
      </div>
      <div className="space-y-3">
        <ToggleRow
          label="Product updates"
          description="New features, improvements, and launch notes."
          checked={productUpdates}
          onChange={setProductUpdates}
        />
        <ToggleRow
          label="AI tips"
          description="Suggestions for getting more from meeting intelligence."
          checked={aiTips}
          onChange={setAiTips}
        />
        <ToggleRow
          label="Billing emails"
          description="Receipts, renewals, and payment issues."
          checked={billingEmails}
          onChange={setBillingEmails}
        />
        <ToggleRow
          label="Meeting reminders"
          description="Optional nudges when you have unreviewed meetings."
          checked={meetingReminders}
          onChange={setMeetingReminders}
        />
      </div>
      <Button onClick={save} disabled={isPending}>
        Save notifications
      </Button>
    </section>
  );
}
