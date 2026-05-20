import {
  DEFAULT_PREFERENCES,
  type NotificationPreferences,
  type UserPreferences,
} from "@/lib/settings/types";

function normalizeNotifications(
  raw: NotificationPreferences | undefined,
): NonNullable<UserPreferences["notifications"]> {
  const base = { ...DEFAULT_PREFERENCES.notifications! };

  if (!raw) return base;

  return {
    productUpdates:
      raw.productUpdates ??
      raw.productAnnouncements ??
      base.productUpdates,
    aiTips: raw.aiTips ?? raw.aiSummaries ?? base.aiTips,
    billingEmails: raw.billingEmails ?? raw.emailUpdates ?? base.billingEmails,
    meetingReminders: raw.meetingReminders ?? base.meetingReminders,
  };
}

export function parsePreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_PREFERENCES };
  }

  const obj = raw as Record<string, unknown>;
  const notifications =
    obj.notifications && typeof obj.notifications === "object"
      ? normalizeNotifications(obj.notifications as NotificationPreferences)
      : DEFAULT_PREFERENCES.notifications;

  return { notifications };
}

export function mergePreferences(
  current: UserPreferences,
  patch: Partial<UserPreferences>,
): UserPreferences {
  return {
    ...current,
    ...patch,
    notifications: {
      ...current.notifications,
      ...patch.notifications,
    },
  };
}
